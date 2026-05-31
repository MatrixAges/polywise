import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'

import { isAuthRequired, readRequestSession } from '../auth'
import { isLocalCliRequest } from './localCliAuth'

import type { OpenApiMeta } from 'trpc-to-openapi'

export type ProcedureMeta = OpenApiMeta
export interface TrpcContext extends Record<string, unknown> {
	req: Request
	resHeaders: Headers
	auth_required: boolean
	auth_bypassed: boolean
	user: Record<string, unknown> | null
	session: Record<string, unknown> | null
}

const t = initTRPC.context<TrpcContext>().meta<ProcedureMeta>().create({
	isServer: true,
	transformer: superjson
})

export const create_trpc_context = async (
	req: Request,
	resHeaders = new Headers(),
	remote_address?: string | null
): Promise<TrpcContext> => {
	const auth_required = await isAuthRequired()
	const auth_bypassed = !auth_required || isLocalCliRequest(req, remote_address)

	if (auth_bypassed) {
		return {
			req,
			resHeaders,
			auth_required,
			auth_bypassed: true,
			user: null,
			session: null
		}
	}

	const auth_state = await readRequestSession(req.headers, resHeaders)

	return {
		req,
		resHeaders,
		auth_required,
		auth_bypassed: false,
		user: auth_state?.user ?? null,
		session: auth_state?.session ?? null
	}
}

const protected_middleware = t.middleware(async opts => {
	const { ctx } = opts

	if (!ctx.auth_bypassed && (!ctx.user || !ctx.session)) {
		throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Please login first.' })
	}

	return opts.next()
})

export const public_p = t.procedure
export const p = public_p.use(protected_middleware)
export const r = t.router
