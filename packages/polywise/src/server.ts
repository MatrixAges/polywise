import { trpcServer } from '@hono/trpc-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import api from './api'
import { applyResponseHeaders, getAuth, getAuthTrustedOrigins, isAuthRequired, requireRequestSession } from './auth'
import { router } from './rpc'
import { create_trpc_context, error_handler, error_middleware, openapi_handler, visit_middleware } from './utils'

export const server = new Hono()
const cors_allowed_origins = new Set(getAuthTrustedOrigins())

server.use(
	'*',
	cors({
		origin: origin => {
			if (!origin) {
				return null
			}

			return cors_allowed_origins.has(origin) ? origin : null
		},
		allowHeaders: ['Content-Type', 'Authorization'],
		allowMethods: ['GET', 'POST', 'OPTIONS'],
		credentials: true
	})
)
server.use('*', visit_middleware)
server.use('/trpc/*', error_middleware)
server.use('/sys/*', async (c, next) => {
	// Keep external IM callbacks public.
	if (c.req.path.startsWith('/sys/im/')) {
		await next()
		return
	}

	if (!(await isAuthRequired())) {
		await next()
		return
	}

	const response_headers = new Headers()
	const auth_state = await requireRequestSession(c.req.raw.headers, response_headers)

	if (!auth_state?.user || !auth_state?.session) {
		return c.json({ error: 'Unauthorized' }, 401)
	}

	await next()
	applyResponseHeaders(c.res.headers, response_headers)
})

server.on(['GET', 'POST'], '/api/auth/*', async c => {
	return await getAuth().handler(c.req.raw)
})
server.all(
	'/trpc/*',
	trpcServer({
		router,
		createContext: async opts => await create_trpc_context(opts.req, opts.resHeaders)
	})
)
server.all('/api/*', openapi_handler)

server.route('/sys', api)

server.onError(error_handler)
