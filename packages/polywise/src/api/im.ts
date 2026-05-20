import { env } from '@core/env'

import type { HonoContext } from '@core/types'

export const health = async (c: HonoContext) => {
	if (!env.im) return c.json({ ok: false, error: 'IM runtime not initialized' }, 503)

	return c.json({ ok: true, ...env.im.getHealth() })
}

export const wechat_events = async (c: HonoContext) => {
	if (!env.im) return c.json({ ok: false, error: 'IM runtime not initialized' }, 503)

	const raw_body = await c.req.text()
	const signature = c.req.header('x-polywise-signature')
	const result = await env.im.handleWechatBridgeEvent(raw_body, signature)

	return c.json(result, result.ok ? 200 : 400)
}

export const wechat_status = async (c: HonoContext) => {
	if (!env.im) return c.json({ ok: false, error: 'IM runtime not initialized' }, 503)

	const raw_body = await c.req.text()
	const signature = c.req.header('x-polywise-signature')
	const result = await env.im.handleWechatBridgeStatus(raw_body, signature)

	return c.json(result, result.ok ? 200 : 400)
}
