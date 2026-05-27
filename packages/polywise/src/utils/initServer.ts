import { config_watcher } from '@core/config'
import { env } from '@core/env'
import { disposeModels } from '@core/llama'
import { serve } from '@hono/node-server'
import { applyWSSHandler } from '@trpc/server/adapters/ws'
import { WebSocketServer } from 'ws'

import { router } from '../rpc'
import { server } from '../server'
import { clearRuntimePidFile, writeRuntimePidFile } from './runtimeControl'
import { create_trpc_context } from './trpc'

import type { Server } from 'http'

export default async () => {
	const { promise, resolve } = Promise.withResolvers()
	let deinit_started = false

	process.title = 'polywise_server'

	const node_server = serve({ fetch: server.fetch, port: 3072 }, ({ port }) => {
		console.log(`Listening on http://localhost:${port}`)
		void writeRuntimePidFile()

		resolve(port)
	})

	const wss = new WebSocketServer({ server: node_server as Server })

	const wss_handler = applyWSSHandler({
		wss,
		router,
		createContext: async opts => {
			const url = `http://localhost:3072${opts.req.url || '/trpc'}`
			const req = new Request(url, {
				headers: new Headers(opts.req.headers as Record<string, string>)
			})

			return await create_trpc_context(req, new Headers())
		}
	})

	const deinit = async () => {
		if (deinit_started) return

		deinit_started = true

		await clearRuntimePidFile()
		await disposeModels().catch(() => null)

		try {
			env.sqlite.close()
		} catch {}

		try {
			config_watcher.close()
		} catch {}

		try {
			wss_handler.broadcastReconnectNotification()
		} catch {}

		try {
			wss.close()
		} catch {}

		try {
			node_server.close()
		} catch {}

		const exit_timer = setTimeout(() => process.exit(0), 300)
		exit_timer.unref?.()
	}

	process.on('SIGINT', deinit)
	process.on('SIGTERM', deinit)

	return promise
}
