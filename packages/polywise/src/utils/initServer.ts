import { serve } from '@hono/node-server'

import { server } from '../server'

export default async () => {
	const { promise, resolve } = Promise.withResolvers()

	process.title = 'polywise_server'

	const node_server = serve({ fetch: server.fetch, port: 3072 }, ({ port }) => {
		console.log(`Listening on http://localhost:${port}`)

		resolve(port)
	})

	node_server.setTimeout(120000)

	const deinit = () => {
		node_server.close(() => process.exit(0))
	}

	process.on('SIGINT', deinit)
	process.on('SIGTERM', deinit)

	return promise
}
