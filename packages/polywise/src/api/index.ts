import { Hono } from 'hono'

import test from './test'

export default new Hono().get('/test', test.validator, test.handler)
