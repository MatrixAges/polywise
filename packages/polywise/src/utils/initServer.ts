import { config_watcher } from '@core/config'
import { env } from '@core/env'
import { disposeModels } from '@core/llama'
import { serve } from '@hono/node-server'

import { server } from '../server'

export default async () => {
	const { promise, resolve } = Promise.withResolvers()

	process.title = 'polywise_server'

	const node_server = serve({ fetch: server.fetch, port: 3072 }, ({ port }) => {
		console.log(`Listening on http://localhost:${port}`)

		resolve(port)
	})

	const deinit = async () => {
		await disposeModels()

		env.sqlite.close()
		config_watcher.close()
		node_server.close()

		setTimeout(() => process.exit(0), 300)
	}

	process.on('SIGINT', deinit)
	process.on('SIGTERM', deinit)

	return promise
}
