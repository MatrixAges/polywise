// await initServer()
// await initConfig()

// startQueue()

// export type { Router } from './rpc'

import { serve } from '@hono/node-server'
import { Hono } from 'hono'

import { initEnv } from './env'

// import './server'

// import { initConfig } from './config'

// import { startQueue } from './task'
// import { initServer } from './utils'

await initEnv()

const server = new Hono()

process.title = 'polywise_server'

serve({ fetch: server.fetch, port: 3072 }, ({ port }) => {
	console.log(`Listening on http://localhost:${port}`)
})
