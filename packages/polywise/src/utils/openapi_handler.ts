import { TRPCError } from '@trpc/server'

import { getApiMap } from '../cli/api/map'
import { router } from '../rpc'
import { getRemoteAddress } from './localCliAuth'
import { create_trpc_context } from './trpc'

import type { Handler } from 'hono'
import type { TrpcContext } from './trpc'

type ApiInputValue = string | number | boolean | Array<string>

type RouteMatch = {
	rpc_path: string
	method: string
	openapi_path: string
	path_params: Record<string, string>
	parameters: Array<{
		name: string
		in: 'path' | 'query' | 'body'
		required: boolean
		type: string
		description?: string
	}>
}

const normalizePath = (path: string) => {
	const normalized = `/${path}`.replace(/\/+/g, '/').replace(/\/$/, '')

	return normalized === '' ? '/' : normalized
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const getPathRegExp = (path: string) =>
	new RegExp(
		`^${escapeRegExp(normalizePath(path)).replace(/\\\{([A-Za-z0-9_]+)\\\}/g, (_, key: string) => `(?<${key}>[^/]+)`)}$`
	)

const route_cache = getApiMap().map(item => ({
	...item,
	method: item.method.toUpperCase(),
	path_regexp: getPathRegExp(item.openapi_path)
}))

const getRouteMatch = (method: string, path: string): RouteMatch | null => {
	for (const item of route_cache) {
		if (item.method !== method.toUpperCase()) {
			continue
		}

		const matched = item.path_regexp.exec(normalizePath(path))

		if (!matched) {
			continue
		}

		return {
			rpc_path: item.rpc_path,
			method: item.method,
			openapi_path: item.openapi_path,
			path_params: Object.fromEntries(
				Object.entries(matched.groups || {}).map(([key, value]) => [key, decodeURIComponent(value)])
			),
			parameters: item.parameters
		}
	}

	return null
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const isCallableRecord = (value: unknown): value is Record<string, unknown> | CallableFunction =>
	Boolean(value) && (typeof value === 'object' || typeof value === 'function')

const parseQueryValue = (req: Request) => {
	const url = new URL(req.url)
	const query = {} as Record<string, string | Array<string>>

	url.searchParams.forEach((value, key) => {
		const current_value = query[key]

		if (current_value === undefined) {
			query[key] = value
			return
		}

		query[key] = Array.isArray(current_value) ? [...current_value, value] : [current_value, value]
	})

	return query
}

const parseBodyValue = async (req: Request) => {
	if (req.method === 'GET' || req.method === 'DELETE') {
		return undefined
	}

	const text = await req.clone().text()

	if (!text.trim()) {
		return {}
	}

	try {
		return JSON.parse(text) as unknown
	} catch (error) {
		throw new TRPCError({
			code: 'PARSE_ERROR',
			message: error instanceof Error ? error.message : 'Failed to parse request body'
		})
	}
}

const coerceValue = (value: string | Array<string>, type: string): ApiInputValue => {
	if (Array.isArray(value)) {
		return value
	}

	if (type === 'number' || type === 'integer') {
		const parsed = Number(value)

		return Number.isNaN(parsed) ? value : parsed
	}

	if (type === 'boolean') {
		if (value === 'true') return true
		if (value === 'false') return false
	}

	return value
}

const getInputValue = async (args: { req: Request; match: RouteMatch }) => {
	const { req, match } = args
	const query = parseQueryValue(req)
	const body = await parseBodyValue(req)
	const input = {
		...(isRecord(body) ? body : {}),
		...query,
		...match.path_params
	} as Record<string, unknown>

	for (const parameter of match.parameters) {
		const current_value = input[parameter.name]

		if (typeof current_value === 'string' || Array.isArray(current_value)) {
			input[parameter.name] = coerceValue(current_value, parameter.type)
		}
	}

	return Object.keys(input).length > 0 ? input : undefined
}

const resolveProcedure = (caller: unknown, rpc_path: string) => {
	let cursor = caller

	for (const segment of rpc_path.split('.').filter(Boolean)) {
		if (!isCallableRecord(cursor)) {
			return null
		}

		const next_cursor = (cursor as Record<string, unknown>)[segment]

		if (next_cursor === undefined) {
			return null
		}

		cursor = next_cursor
	}

	return typeof cursor === 'function' ? cursor : null
}

const getHttpStatus = (error: unknown) => {
	if (!(error instanceof TRPCError)) {
		return 500
	}

	switch (error.code) {
		case 'BAD_REQUEST':
		case 'PARSE_ERROR':
			return 400
		case 'UNAUTHORIZED':
			return 401
		case 'FORBIDDEN':
			return 403
		case 'NOT_FOUND':
			return 404
		case 'METHOD_NOT_SUPPORTED':
			return 405
		case 'CONFLICT':
			return 409
		case 'PAYLOAD_TOO_LARGE':
			return 413
		case 'UNSUPPORTED_MEDIA_TYPE':
			return 415
		case 'TOO_MANY_REQUESTS':
			return 429
		default:
			return 500
	}
}

const applyHeaders = (ctx?: TrpcContext) => {
	const headers = {} as Record<string, string>

	ctx?.resHeaders.forEach((value, key) => {
		headers[key] = value
	})

	return headers
}

export default (async c => {
	const match = getRouteMatch(c.req.method.toUpperCase(), c.req.path.replace(/^\/api/, ''))

	if (!match) {
		return c.json({ error: 'Not found' }, 404)
	}

	const remote_address = getRemoteAddress(c.env)
	const ctx = await create_trpc_context(c.req.raw, new Headers(), remote_address)

	try {
		const input = await getInputValue({
			req: c.req.raw,
			match
		})
		const caller = router.createCaller(ctx)
		const procedure = resolveProcedure(caller, match.rpc_path)

		if (!procedure) {
			return c.json({ error: `API target not found: ${match.rpc_path}` }, 404, applyHeaders(ctx))
		}

		const data = await Promise.resolve(
			(input === undefined ? procedure() : procedure(input)) as Promise<unknown> | unknown
		)

		return c.json(data, 200, applyHeaders(ctx))
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)

		return c.json({ error: message }, getHttpStatus(error), applyHeaders(ctx))
	}
}) as Handler
