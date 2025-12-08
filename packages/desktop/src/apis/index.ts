import { Hono } from 'hono'
import { cors } from 'hono/cors'

import chat from './chat'

const app = new Hono()

// app.use(cors({ origin: '*' })).post('/api/chat', chat)

export default app
