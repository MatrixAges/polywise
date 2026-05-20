import { Hono } from 'hono'

import * as im from './im'
import * as session from './session'

const api = new Hono()
	.get('/session', session.get)
	.post('/session', session.post)
	.get('/im/health', im.health)
	.post('/im/feishu/events', im.feishu_events)
	.post('/im/wechat/events', im.wechat_events)
	.post('/im/wechat/status', im.wechat_status)

export type Api = typeof api

export default api
