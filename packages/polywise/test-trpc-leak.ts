import { serve } from '@hono/node-server'
import { trpcServer } from '@hono/trpc-server'
import { initTRPC } from '@trpc/server'
import { Hono } from 'hono'

const t = initTRPC.create()
const router = t.router({
	hello: t.procedure.subscription(async function* ({ signal }) {
		for (let i = 0; i < 3; i++) {
			yield i
			await new Promise(r => setTimeout(r, 100))
		}
	})
})

const app = new Hono()
app.use('/trpc/*', trpcServer({ router }))

const server = serve({ fetch: app.fetch, port: 0 }, async info => {
	const reqs = []
	for (let i = 0; i < 15; i++) {
		reqs.push(fetch(`http://localhost:${info.port}/trpc/hello`))
	}
	await Promise.all(reqs)
	setTimeout(() => {
		server.close()
		process.exit(0)
	}, 100)
})
