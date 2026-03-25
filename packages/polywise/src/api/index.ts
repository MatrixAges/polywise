import { Hono } from 'hono'

import heartbeat from './heartbeat'
import * as session from './session'

const api = new Hono().get('/heartbeat', heartbeat).get('/session', session.get).post('/session', session.post)

export type Api = typeof api

export default api
