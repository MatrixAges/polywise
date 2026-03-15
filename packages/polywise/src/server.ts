import { trpcServer } from '@hono/trpc-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { createOpenApiFetchHandler } from 'trpc-to-openapi'

import api from './api'
import { router } from './rpc'

import type { ContentfulStatusCode } from 'hono/utils/http-status'

export const server = new Hono()

server.use('*', cors())
server.all('/trpc/*', trpcServer({ router }))
server.all('/openapi/*', async c => {
	const res = await createOpenApiFetchHandler({ endpoint: '/openapi', req: c.req.raw, router })

	if (res.status >= 400) {
		const data = await res.json()

		let error = data.message || 'Internal Server Error'

		if (data.issues && Array.isArray(data.issues)) {
			error = data.issues.map((i: any) => `[${i.path.join('.')}] ${i.message}`).join(', ')
		}

		return c.json({ error }, res.status as ContentfulStatusCode)
	}

	return res
})

server.route('/api', api)

server.onError((err, c) => {
	const status = err instanceof HTTPException ? err.status : 500
	const code = status === 400 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR'

	return c.json(
		{
			code,
			message: err.message || 'Internal Server Error'
		},
		status
	)
})
