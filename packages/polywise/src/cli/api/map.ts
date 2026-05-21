import { generateOpenApiDocument } from 'trpc-to-openapi'

import { router } from '../../rpc'
import { renderHelpTree, root_help_id } from '../shared/help'
import { manual_api_meta } from './meta'

import type { AnyProcedure } from '@trpc/server/unstable-core-do-not-import'
import type { ZodTypeAny } from 'zod'
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

let openapi_doc_cache: ReturnType<typeof generateOpenApiDocument> | null | undefined
let api_map_cache: Array<ApiMapItem> | null = null

const getZodDef = (schema: ZodTypeAny | null | undefined) =>
	((schema as any)?._def || (schema as any)?.def || null) as Record<string, unknown> | null

const unwrapZodSchema = (schema: ZodTypeAny | null | undefined): ZodTypeAny | null => {
	if (!schema) return null

	const def = getZodDef(schema)
	const type_name = String(def?.typeName || def?.type || '')

	if (type_name === 'ZodOptional' || type_name === 'optional') {
		return unwrapZodSchema((def?.innerType || def?.innerTypeName || def?.wrapped) as ZodTypeAny)
	}

	if (type_name === 'ZodNullable' || type_name === 'nullable') {
		return unwrapZodSchema((def?.innerType || def?.wrapped) as ZodTypeAny)
	}

	if (type_name === 'ZodDefault' || type_name === 'default') {
		return unwrapZodSchema((def?.innerType || def?.wrapped) as ZodTypeAny)
	}

	if (type_name === 'ZodEffects' || type_name === 'effects') {
		return unwrapZodSchema((def?.schema || def?.innerType) as ZodTypeAny)
	}

	return schema
}

const getZodObjectShape = (schema: ZodTypeAny | null) => {
	const def = getZodDef(schema)
	const type_name = String(def?.typeName || def?.type || '')

	if (!schema || (type_name !== 'ZodObject' && type_name !== 'object')) {
		return null
	}

	const shape = (schema as any)?.shape

	if (typeof shape === 'function') {
		return shape()
	}

	if (shape && typeof shape === 'object') {
		return shape
	}

	if (typeof def?.shape === 'function') {
		return def.shape()
	}

	return (def?.shape as Record<string, ZodTypeAny>) || null
}

const getZodParameterType = (schema: ZodTypeAny | null | undefined) => {
	const unwrapped = unwrapZodSchema(schema)
	const def = getZodDef(unwrapped)
	const type_name = String(def?.typeName || def?.type || '')

	switch (type_name) {
		case 'ZodString':
		case 'string':
			return 'string'
		case 'ZodNumber':
		case 'number':
			return 'number'
		case 'ZodBigInt':
		case 'bigint':
			return 'integer'
		case 'ZodBoolean':
		case 'boolean':
			return 'boolean'
		case 'ZodArray':
		case 'array':
			return 'array'
		case 'ZodObject':
		case 'object':
			return 'object'
		case 'ZodEnum':
		case 'ZodNativeEnum':
		case 'enum':
			return 'string'
		case 'ZodLiteral': {
			const value = def?.value

			if (typeof value === 'number') return 'number'
			if (typeof value === 'boolean') return 'boolean'
			return 'string'
		}
		default:
			return 'string'
	}
}

const isZodOptionalLike = (schema: ZodTypeAny | null | undefined) => {
	const def = getZodDef(schema)
	const type_name = String(def?.typeName || def?.type || '')

	return (
		type_name === 'ZodOptional' ||
		type_name === 'optional' ||
		type_name === 'ZodDefault' ||
		type_name === 'default'
	)
}

const getProcedureInputParameters = (procedure: AnyProcedure, method: ApiMapItem['method']) => {
	const inputs = (((procedure as any)?._def?.inputs as Array<ZodTypeAny>) || []).map(item => unwrapZodSchema(item))
	const object_schema = inputs.map(item => getZodObjectShape(item)).find(Boolean)

	if (!object_schema) {
		return []
	}

	const parameter_in = method === 'GET' || method === 'DELETE' ? ('query' as const) : ('body' as const)

	return Object.entries(object_schema).map(([name, schema]) => ({
		name,
		in: parameter_in,
		required: !isZodOptionalLike(schema as ZodTypeAny),
		type: getZodParameterType(schema as ZodTypeAny),
		description: undefined
	}))
}

const getOpenApiDoc = () => {
	if (openapi_doc_cache !== undefined) {
		return openapi_doc_cache
	}

	try {
		openapi_doc_cache = generateOpenApiDocument(router, {
			title: 'Polywise API',
			version: '0.0.1',
			baseUrl: 'http://localhost:3072/api'
		})
	} catch {
		openapi_doc_cache = null
	}

	return openapi_doc_cache
}

const getOperation = (method: string, openapi_path: string) => {
	const openapi_doc = getOpenApiDoc()

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

const normalizeCliSegments = (rpc_path: string, openapi_path: string) => {
	const rpc_segments = rpc_path.split('.').filter(Boolean)

	if (rpc_segments.length > 1) {
		return rpc_segments
	}

	const path_segments = openapi_path
		.split('/')
		.map(item => item.trim())
		.filter(Boolean)
		.map(item => item.replace(/^\{|\}$/g, ''))
		.filter(item => /^[A-Za-z0-9_-]+$/.test(item))

	if (path_segments.length > 1) {
		return path_segments
	}

	return rpc_segments
}

export const getApiMap = (): Array<ApiMapItem> => {
	if (api_map_cache) {
		return api_map_cache
	}

	api_map_cache = getProcedureEntries()
		.map(([rpc_path, procedure]) => {
			const meta = (procedure._def.meta || {}) as {
				openapi: {
					method: ApiMapItem['method']
					path: string
					summary?: string
					description?: string
				}
			}
			const operation = getOperation(meta.openapi.method, meta.openapi.path)
			const override = manual_api_meta_map[rpc_path]

			if (override?.hidden) {
				return null
			}

			const cli_segments = normalizeCliSegments(rpc_path, meta.openapi.path)
			const group_path = cli_segments.slice(0, -1)
			const command_name = cli_segments.at(-1) || rpc_path
			const openapi_parameters = getParameters(operation)
			const parameters =
				openapi_parameters.length > 0
					? openapi_parameters
					: getProcedureInputParameters(procedure, meta.openapi.method)

			return {
				id: rpc_path,
				rpc_path,
				method: meta.openapi.method,
				openapi_path: meta.openapi.path,
				cli_path: ['api', ...group_path, command_name],
				group_path,
				summary: meta.openapi.summary || operation?.summary || operation?.description || rpc_path,
				description: meta.openapi.description || operation?.description,
				input_hint: toInputHints(parameters),
				examples: override?.examples || [],
				parameters
			}
		})
		.filter(Boolean) as Array<ApiMapItem>

	return api_map_cache
}

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
		let parent_id = root_help_id
		const group_segments = item.group_path

		group_segments.forEach((segment, index) => {
			const group_path = group_segments.slice(0, index + 1)
			const group_id = `group:${group_path.join('.')}`

			if (!tree[group_id]) {
				tree[group_id] = {
					id: group_id,
					title: segment,
					summary: `${group_path.join('.')} API commands`,
					kind: 'group',
					children: [],
					hints: [`Use \`api ${group_path.join(' ')} -h\` for the next level.`]
				}
				tree[parent_id].children!.push(group_id)
			}

			parent_id = group_id
		})

		tree[parent_id].children!.push(item.id)
		tree[item.id] = {
			id: item.id,
			title: item.cli_path.at(-1) || item.id,
			summary: item.summary,
			kind: 'command',
			hints: [
				`${item.method} ${item.openapi_path}`,
				...(item.input_hint.length ? [`Parameters: ${item.input_hint.join(', ')}`] : [])
			],
			examples: item.examples
		}
	}

	return tree
}

export const renderApiHelp = (path: Array<string>) => renderHelpTree(getApiHelpTree(), path)
const manual_api_meta_map = manual_api_meta as Record<
	string,
	{
		examples?: Array<string>
		hidden?: boolean
	}
>
