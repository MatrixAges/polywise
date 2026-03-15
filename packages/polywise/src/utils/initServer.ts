import { serve } from '@hono/node-server'

import { server } from '../server'

export default async () => {
	const { promise, resolve } = Promise.withResolvers()

	process.title = 'polywise_server'

	serve({ fetch: server.fetch, port: 3072 }, ({ port }) => {
		console.log(`Listening on http://localhost:${port}`)

		resolve(port)
	})

	return promise
}
