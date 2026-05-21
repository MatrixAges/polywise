import { generateOpenApiDocument } from 'trpc-to-openapi'

import { router } from '../../rpc'
import { renderHelpTree, root_help_id } from '../shared/help'
import { manual_api_meta } from './meta'

import type { AnyProcedure } from '@trpc/server/unstable-core-do-not-import'
import type { ApiMapItem, HelpNode } from '../types'

type OpenApiOperation = {
	summary?: string
	description?: string
	parameters?: Array<{
		name?: string
		in?: 'path' | 'query' | 'header' | 'cookie'
		required?: boolean
		description?: string
		schema?: { type?: string }
	}>
	requestBody?: {
		content?: Record<
			string,
			{
				schema?: {
					type?: string
					properties?: Record<string, { type?: string; description?: string }>
					required?: Array<string>
				}
			}
		>
	}
}

const openapi_doc = (() => {
	try {
		return generateOpenApiDocument(router, {
			title: 'Polywise API',
			version: '0.0.1',
			baseUrl: 'http://localhost:3072/api'
		})
	} catch {
		return null
	}
})()

const getOperation = (method: string, openapi_path: string) => {
	if (!openapi_doc) return null

	const path_item = openapi_doc.paths?.[openapi_path] as Record<string, OpenApiOperation> | undefined

	if (!path_item) return null

	return path_item[method.toLowerCase()] || null
}

const getProcedureEntries = () =>
	Object.entries(router._def.procedures as unknown as Record<string, AnyProcedure>).filter(([, procedure]) => {
		const meta = (procedure._def.meta || {}) as {
			openapi?: { enabled?: boolean; method?: string; path?: string }
		}

		return (
			procedure._def.type !== 'subscription' &&
			meta.openapi?.enabled !== false &&
			typeof meta.openapi?.method === 'string' &&
			typeof meta.openapi?.path === 'string'
		)
	})

const getBodyParameters = (operation: OpenApiOperation | null) => {
	const schema = operation?.requestBody?.content?.['application/json']?.schema

	if (!schema?.properties) {
		return []
	}

	const required = new Set(schema.required || [])

	return Object.entries(schema.properties).map(([name, value]) => ({
		name,
		in: 'body' as const,
		required: required.has(name),
		type: value.type || 'unknown',
		description: value.description
	}))
}

const getParameters = (operation: OpenApiOperation | null) => {
	const parameters =
		operation?.parameters
			?.filter(item => item.in === 'path' || item.in === 'query')
			.map(item => ({
				name: item.name || 'unknown',
				in: item.in as 'path' | 'query',
				required: Boolean(item.required),
				type: item.schema?.type || 'string',
				description: item.description
			})) || []

	return [...parameters, ...getBodyParameters(operation)]
}

const toInputHints = (parameters: ReturnType<typeof getParameters>) =>
	parameters.map(item => `--${item.name} <${item.type}${item.required ? '' : '?'}>`)

export const getApiMap = (): Array<ApiMapItem> =>
	getProcedureEntries().map(([rpc_path, procedure]) => {
		const meta = (procedure._def.meta || {}) as {
			openapi: {
				method: ApiMapItem['method']
				path: string
				summary?: string
				description?: string
			}
			cli?: {
				group?: Array<string>
				name?: string
				summary?: string
				hidden?: boolean
				examples?: Array<string>
			}
		}
		const operation = getOperation(meta.openapi.method, meta.openapi.path)
		const override = manual_api_meta_map[rpc_path]
		const group_path = meta.cli?.group || override?.group || rpc_path.split('.').slice(0, -1) || ['system']
		const command_name = meta.cli?.name || override?.name || rpc_path.split('.').at(-1) || rpc_path
		const parameters = getParameters(operation)

		return {
			id: rpc_path,
			rpc_path,
			method: meta.openapi.method,
			openapi_path: meta.openapi.path,
			cli_path: ['api', ...group_path, command_name],
			group_path,
			summary:
				meta.cli?.summary ||
				meta.openapi.summary ||
				override?.summary ||
				operation?.summary ||
				operation?.description ||
				rpc_path,
			description: meta.openapi.description || operation?.description,
			input_hint: toInputHints(parameters),
			examples: meta.cli?.examples || override?.examples || [],
			parameters
		}
	})

export const getApiMapItem = (rpc_path: string) => getApiMap().find(item => item.rpc_path === rpc_path) || null

export const getApiHelpTree = () => {
	const tree = {
		[root_help_id]: {
			id: root_help_id,
			title: 'api',
			summary: 'Backend API index with progressive disclosure.',
			kind: 'root',
			children: [],
			hints: ['Use `api <group> -h` for the next level.']
		}
	} as Record<string, HelpNode>

	for (const item of getApiMap()) {
		const root_group = item.group_path[0] || 'system'
		const group_id = `group:${root_group}`

		if (!tree[group_id]) {
			tree[group_id] = {
				id: group_id,
				title: root_group,
				summary: `${root_group} API commands`,
				kind: 'group',
				children: [],
				hints: [`Use \`api ${root_group} -h\` for command details.`]
			}
			tree[root_help_id].children!.push(group_id)
		}

		tree[group_id].children!.push(item.id)
		tree[item.id] = {
			id: item.id,
			title: item.cli_path.at(-1) || item.id,
			summary: item.summary,
			kind: 'command',
			hints: item.input_hint.length ? [`Parameters: ${item.input_hint.join(', ')}`] : [],
			examples: item.examples
		}
	}

	return tree
}

export const renderApiHelp = (path: Array<string>) => renderHelpTree(getApiHelpTree(), path)
const manual_api_meta_map = manual_api_meta as Record<
	string,
	{
		group: Array<string>
		name: string
		summary: string
		examples: Array<string>
	}
>
