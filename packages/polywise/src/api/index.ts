import { Hono } from 'hono'

import chat from './chat'
import test from './test'

export default new Hono().get('/test', test.validator, test.handler).post('/chat', chat.validator, chat.handler)
