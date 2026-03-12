import { serve } from '@hono/node-server'
import { trpcServer } from '@hono/trpc-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import { router } from './rpcs'

export const server = new Hono()

server.use('*', cors())
server.all('/trpc/*', trpcServer({ router }))

export const initServer = async () => {
	const { promise, resolve } = Promise.withResolvers()

	serve({ fetch: server.fetch, port: 3072 }, ({ port }) => {
		console.log(`Listening on http://localhost:${port}`)

		resolve(port)
	})

	return promise
}
