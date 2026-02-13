import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

import polywise from './polywise'

import type { QueryRequest, SaveRequest, ServerOptions } from './types'

export const createServer = async (options: ServerOptions) => {
	const app = new Hono()

	app.use('*', logger())
	app.use('*', cors())

	console.log('Initializing Polywise...')

	await polywise.init(options.polywise)

	console.log('Polywise initialized.')

	app.get('/health', c => c.json({ status: 'ok', version: '1.0.0' }))

	app.post('/query', async c => {
		try {
			const body = await c.req.json<QueryRequest>()
			const { query, ...rest } = body

			if (!query) {
				return c.json({ error: 'Query is required' }, 400)
			}

			const process = polywise.process(query)

			const result = await polywise.query({
				query,
				process,
				...rest
			})

			return c.json(result)
		} catch (error) {
			console.error('Query error:', error)

			return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
		}
	})

	app.post('/save', async c => {
		try {
			const body = await c.req.json<SaveRequest>()
			const { content, ...rest } = body

			if (!content) {
				return c.json({ error: 'Content is required' }, 400)
			}

			await polywise.save({
				content,
				...rest
			})

			return c.json({ success: true })
		} catch (error) {
			console.error('Save error:', error)

			return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
		}
	})

	return {
		app,
		polywise
	}
}
