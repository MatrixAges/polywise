import { Hono } from 'hono'

import * as session from './session'
import test from './test'

export default new Hono()
	.get('/test', test.validator, test.handler)
	.get('/session', session.get)
	.post('/session', session.post)
