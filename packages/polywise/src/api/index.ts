import { Hono } from 'hono'

import * as session from './session'
import test from './test'

export default new Hono()
	.get('/test', test.validator, test.handler)
	.get('/api/session', session.get)
	.post('/api/session', session.post)
