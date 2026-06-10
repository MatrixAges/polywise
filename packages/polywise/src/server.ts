import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { serveStatic } from '@hono/node-server/serve-static'
import { trpcServer } from '@hono/trpc-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import api from './api'
import {
	applyResponseHeaders,
	getAuth,
	getAuthTrustedOrigins,
	isAuthRequired,
	isLocalCliRequest,
	requireRequestSession
} from './auth'
import { env } from './env'
import { router } from './rpc'
import { create_trpc_context, error_handler, error_middleware, openapi_handler, visit_middleware } from './utils'
import { getRemoteAddress } from './utils/localCliAuth'

export const server = new Hono()
const cors_allowed_origins = new Set(getAuthTrustedOrigins())
const is_dev = process.env.NODE_ENV === 'development'
export const standalone_app_dist_root = fileURLToPath(new URL('./app_dist', import.meta.url))
export const standalone_app_dist_index = fileURLToPath(new URL('./app_dist/index.html', import.meta.url))
export const has_standalone_app_dist = existsSync(standalone_app_dist_index)

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
	if (c.req.path.startsWith('/sys/im/')) {
		await next()

		return
	}

	if (!(await isAuthRequired())) {
		await next()
		return
	}

	if (isLocalCliRequest(c.req.raw, getRemoteAddress(c.env))) {
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
		createContext: async (opts, c) =>
			await create_trpc_context(opts.req, opts.resHeaders, getRemoteAddress(c.env))
	})
)
server.all('/api/*', openapi_handler)

server.route('/sys', api)

if (env.platform === 'standalone') {
	server.get('/app', c => c.redirect('/app/'))

	if (!is_dev && has_standalone_app_dist) {
		server.use(
			'/app/*',
			serveStatic({
				root: standalone_app_dist_root,
				rewriteRequestPath: path => path.replace(/^\/app\/?/, '')
			})
		)

		server.get('/app/*', async c => {
			const request_path = c.req.path.replace(/^\/app\/?/, '')
			const last_segment = request_path.split('/').at(-1) || ''

			if (last_segment.includes('.')) {
				return c.text('Not Found', 404)
			}

			return await serveStatic({ path: standalone_app_dist_index })(c, async () => {})
		})
	}
}

server.onError(error_handler)
