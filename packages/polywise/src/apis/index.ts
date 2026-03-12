import { server } from '@core/utils'

server.get('/api/test', ctx => {
	return ctx.json({
		message: 'Hello from Polywise API!'
	})
})
