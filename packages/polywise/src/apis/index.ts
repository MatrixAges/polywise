import { server } from '@core/server'

server.get('/api/test', ctx => {
	return ctx.json({
		message: 'Hello from Polywise API!'
	})
})
