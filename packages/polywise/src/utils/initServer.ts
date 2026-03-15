import { serve } from '@hono/node-server'

import { server } from '../server'

export default async () => {
	const { promise, resolve } = Promise.withResolvers()

	process.title = 'polywise_server'

	const s = serve({ fetch: server.fetch, port: 3072 }, ({ port }) => {
		console.log(`Listening on http://localhost:${port}`)

		resolve(port)
	})

	const deinit = () => {
		s.close(() => process.exit(0))
	}

	process.on('SIGINT', deinit)
	process.on('SIGTERM', deinit)

	return promise
}
