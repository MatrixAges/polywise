import { serve } from '@hono/node-server'
import { Hono } from 'hono'

const app = new Hono()

app.get('/', c => c.text('Hello!'))

const server = serve({ fetch: app.fetch, port: 0 }, async info => {
	for (let i = 0; i < 15; i++) {
		await fetch(`http://localhost:${info.port}/`)
	}
	setTimeout(() => {
		server.close()
		process.exit(0)
	}, 100)
})
