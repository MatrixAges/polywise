import { getApiMap, getApiMapItem, renderApiHelp } from '@core/cli/api/map'
import { tool } from 'ai'
import { array, boolean, number, object, record, string, union, enum as zod_enum } from 'zod'

type ApiInputValue = string | number | boolean

const inputSchema = object({
	action: zod_enum(['help', 'list', 'schema', 'call']).default('help'),
	path: array(string())
		.optional()
		.describe('Optional help path segments like ["session"] or ["session", "create"].'),
	target: string().optional().describe('Target rpc path such as "session.create" for schema or call actions.'),
	keyword: string().optional().describe('Optional fuzzy keyword for list action.'),
	input: record(string(), union([string(), number(), boolean()]))
		.optional()
		.describe('Flat input object for call action. Values may be string, number, or boolean.')
})

const resolvePathInput = (path: string, input?: Record<string, ApiInputValue>) => {
	const path_input = { ...(input || {}) }
	const resolved_path = path.replace(/\{([A-Za-z0-9_]+)\}/g, (_, key: string) => {
		const value = path_input[key]

		delete path_input[key]

		return encodeURIComponent(value ?? `{${key}}`)
	})

	return {
		resolved_path,
		rest_input: path_input
	}
}

const buildUrl = (path: string, input?: Record<string, ApiInputValue>) => {
	const { resolved_path, rest_input } = resolvePathInput(path, input)
	const url = new URL(resolved_path, 'http://localhost:3072/api')

	if (!input) {
		return url.toString()
	}

	for (const [key, value] of Object.entries(rest_input)) {
		url.searchParams.set(key, String(value))
	}

	return url.toString()
}

const callApi = async (
	target: NonNullable<ReturnType<typeof getApiMapItem>>,
	input?: Record<string, ApiInputValue>
) => {
	const method = target.method
	const is_get_like = method === 'GET' || method === 'DELETE'
	const { rest_input } = resolvePathInput(target.openapi_path, input)
	const res = await fetch(buildUrl(target.openapi_path, is_get_like ? input : undefined), {
		method,
		headers: {
			'content-type': 'application/json'
		},
		...(is_get_like ? {} : { body: JSON.stringify(rest_input) })
	})
	const text = await res.text()
	let data: unknown = text

	try {
		data = JSON.parse(text)
	} catch {}

	return {
		ok: res.ok,
		status: res.status,
		method,
		path: target.openapi_path,
		data
	}
}

export const createApiTool = () =>
	tool({
		description: [
			'Inspect and call CLI-friendly backend APIs through a progressive disclosure index.',
			'Use action "help" first to see top-level groups or the next level under a group.',
			'Use action "schema" only after you have selected a concrete rpc path.',
			'Use action "call" only for non-subscription APIs already exposed through api_map.'
		].join('\n'),
		inputSchema,
		execute: async input => {
			if (input.action === 'help') {
				return renderApiHelp(input.path || [])
			}

			if (input.action === 'list') {
				const keyword = input.keyword?.trim().toLowerCase()
				const items = getApiMap()
					.filter(item =>
						keyword
							? `${item.rpc_path}\n${item.summary}\n${item.group_path.join(' ')}`
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
						summary: item.summary
					}))
				}
			}

			if (!input.target) {
				throw new Error('target is required for schema and call actions')
			}

			const target = getApiMapItem(input.target)

			if (!target) {
				throw new Error(`API target not found: ${input.target}`)
			}

			if (input.action === 'schema') {
				return {
					rpc_path: target.rpc_path,
					method: target.method,
					path: target.openapi_path,
					summary: target.summary,
					parameters: target.parameters,
					examples: target.examples
				}
			}

			return callApi(target, input.input)
		}
	})
