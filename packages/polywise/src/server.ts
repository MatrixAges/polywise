import { trpcServer } from '@hono/trpc-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { createOpenApiFetchHandler } from 'trpc-to-openapi'

import api from './api'
import { router } from './rpc'

export const server = new Hono()

server.use('*', cors())
server.all('/trpc/*', trpcServer({ router }))
server.all('/openapi/*', c => createOpenApiFetchHandler({ endpoint: '/openapi', req: c.req.raw, router }))

server.route('/api', api)

server.onError((err, c) => {
	const status = err instanceof HTTPException ? err.status : 500

	return c.json({ success: false, message: err.message || 'Internal Server Error' }, status)
})
