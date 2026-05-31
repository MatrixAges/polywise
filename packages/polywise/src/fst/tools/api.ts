import { getApiMap, getApiMapItem, renderApiHelp } from '@core/cli/api/map'
import { router } from '@core/rpc'
import { polywise_cli_header } from '@core/utils/localCliAuth'
import { create_trpc_context } from '@core/utils/trpc'

import type { ApiMapItem } from '@core/cli/types'

export type ApiInputValue = string | number | boolean

export interface ApiInput {
	action: 'help' | 'list' | 'input_schema' | 'call'
	path?: Array<string>
	target?: string
	keyword?: string
	input?: Record<string, ApiInputValue>
}

type ApiTarget = ApiMapItem
type ApiParameter = ApiMapItem['parameters'][number]
type CallerProcedure = (input?: Record<string, ApiInputValue>) => Promise<unknown>

const getErrorMessage = (error: unknown) => {
	if (error instanceof Error) {
		return error.message
	}

	return String(error)
}

const getRequiredParameters = (target: ApiTarget) => target.parameters.filter(item => item.required)

const getMissingParameters = (target: ApiTarget, input?: Record<string, ApiInputValue>) =>
	getRequiredParameters(target).filter(item => !input || !(item.name in input))

const getLocalCaller = async () => {
	const headers = new Headers({
		[polywise_cli_header]: '1'
	})
	const req = new Request('http://localhost:3072/trpc/local-call', {
		method: 'POST',
		headers
	})
	const ctx = await create_trpc_context(req, new Headers())

	return router.createCaller(ctx)
}

const resolveCallerProcedure = (caller: unknown, rpc_path: string): CallerProcedure | null => {
	let cursor = caller

	for (const segment of rpc_path.split('.').filter(Boolean)) {
		if (!cursor || typeof cursor !== 'object') {
			return null
		}

		const next_cursor = (cursor as Record<string, unknown>)[segment]

		if (next_cursor === undefined) {
			return null
		}

		cursor = next_cursor
	}

	return typeof cursor === 'function' ? (cursor as CallerProcedure) : null
}

const buildSchemaGuardResult = (args: { target: ApiTarget; missing_parameters: Array<ApiParameter> }) => {
	const { target, missing_parameters } = args

	return {
		surface_used: 'api_map',
		ok: false,
		status: 400,
		method: target.method,
		path: target.openapi_path,
		data: {
			error: `Missing required input for ${target.rpc_path}. Inspect input_schema before calling this target.`,
			rpc_path: target.rpc_path,
			missing_parameters: missing_parameters.map(item => ({
				name: item.name,
				in: item.in,
				type: item.type
			})),
			required_parameters: getRequiredParameters(target),
			suggested_action: {
				action: 'input_schema',
				target: target.rpc_path
			},
			examples: target.examples
		}
	}
}

const callTrpc = async (target: ApiTarget, input?: Record<string, ApiInputValue>) => {
	const missing_parameters = getMissingParameters(target, input)

	if (missing_parameters.length > 0) {
		return buildSchemaGuardResult({
			target,
			missing_parameters
		})
	}

	const procedure = resolveCallerProcedure(await getLocalCaller(), target.rpc_path)

	if (!procedure) {
		return {
			surface_used: 'trpc',
			ok: false,
			status: 404,
			method: target.method,
			path: target.openapi_path,
			data: {
				error: `Local caller target not found: ${target.rpc_path}`
			}
		}
	}

	try {
		const data = target.parameters.length > 0 ? await procedure(input || {}) : await procedure()

		return {
			surface_used: 'trpc',
			ok: true,
			status: 200,
			method: target.method,
			path: target.openapi_path,
			data
		}
	} catch (error) {
		return {
			surface_used: 'trpc',
			ok: false,
			status: 400,
			method: target.method,
			path: target.openapi_path,
			data: {
				error: getErrorMessage(error),
				rpc_path: target.rpc_path,
				suggested_action:
					target.parameters.length > 0
						? {
								action: 'input_schema',
								target: target.rpc_path
							}
						: undefined
			}
		}
	}
}

export const executeApi = async (input: ApiInput) => {
	if (input.action === 'help') {
		return renderApiHelp(input.path || [])
	}

	if (input.action === 'list') {
		const keyword = input.keyword?.trim().toLowerCase()
		const items = getApiMap()
			.filter(item =>
				keyword
					? `${item.rpc_path}\n${item.description || item.summary}\n${item.group_path.join(' ')}`
							.toLowerCase()
							.includes(keyword)
					: true
			)
			.sort((left, right) => left.rpc_path.localeCompare(right.rpc_path))
			.slice(0, 20)

		return {
			count: items.length,
			items: items.map(item => ({
				rpc_path: item.rpc_path,
				method: item.method,
				path: item.openapi_path,
				description: item.description || item.summary
			}))
		}
	}

	if (!input.target) {
		throw new Error('target is required for input_schema and call actions')
	}

	const target = getApiMapItem(input.target)

	if (!target) {
		throw new Error(`API target not found: ${input.target}`)
	}

	if (input.action === 'input_schema') {
		return {
			rpc_path: target.rpc_path,
			method: target.method,
			path: target.openapi_path,
			description: target.description || target.summary,
			parameters: target.parameters,
			examples: target.examples
		}
	}

	return callTrpc(target, input.input)
}
