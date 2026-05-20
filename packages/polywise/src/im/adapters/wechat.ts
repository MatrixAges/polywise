import { createHmac, timingSafeEqual } from 'node:crypto'
import { im_peer_state } from '@core/db/schema'
import { addImPeerState, getImPeerState, setImPeerState } from '@core/db/services'
import { and, eq } from 'drizzle-orm'

import { wechat_bridge_send_path, wechat_bridge_typing_path } from '../config'
import { buildImPeerKey } from '../route'
import { safeJsonParse } from '../utils'
import { BaseImAdapter } from './base'

import type { ImAccount } from '@core/db'
import type { ImInboundEvent, ImRoute, ImSendReceipt } from '../types'

interface WechatBridgeConfig {
	bridge_base_url: string
	secret: string
	send_path?: string
	typing_path?: string
}

const getSignature = (secret: string, raw_body: string) => createHmac('sha256', secret).update(raw_body).digest('hex')

export default class WechatAdapter extends BaseImAdapter {
	platform = 'wechat' as const
	capabilities = {
		typing: true,
		message_edit: false,
		threads: false,
		attachments: false
	}
	config: WechatBridgeConfig

	constructor(account: ImAccount) {
		super(account.account_id)
		this.config = safeJsonParse(account.config_json, {
			bridge_base_url: '',
			secret: ''
		} satisfies WechatBridgeConfig)
	}

	async connect() {}

	async disconnect() {}

	private async postBridge(path: string, body: Record<string, unknown>) {
		if (!this.config.bridge_base_url) {
			throw new Error(`WeChat bridge base URL missing for account ${this.account_id}`)
		}

		if (!this.config.secret) {
			throw new Error(`WeChat bridge secret missing for account ${this.account_id}`)
		}

		const raw_body = JSON.stringify(body)

		const response = await fetch(new URL(path, this.config.bridge_base_url), {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				'x-polywise-signature': getSignature(this.config.secret, raw_body)
			},
			body: raw_body
		})

		if (!response.ok) {
			throw new Error(`WeChat bridge request failed: ${response.status} ${await response.text()}`)
		}

		return response.json().catch(() => ({}))
	}

	async sendTyping(route: ImRoute) {
		if (!this.config.bridge_base_url) return

		await this.postBridge(this.config.typing_path || wechat_bridge_typing_path, {
			account_id: this.account_id,
			peer_id: route.chat_id
		})
	}

	async sendMessage(args: { route: ImRoute; text: string }): Promise<ImSendReceipt> {
		const response = await this.postBridge(this.config.send_path || wechat_bridge_send_path, {
			account_id: this.account_id,
			peer_id: args.route.chat_id,
			text: args.text
		})

		return {
			id: typeof response?.message_id === 'string' ? response.message_id : undefined,
			raw: response
		}
	}

	async verifyBridgePayload(raw_body: string, signature: string | undefined) {
		if (!this.config.secret) return false
		if (!signature) return false

		const expected = getSignature(this.config.secret, raw_body)
		const expected_buffer = Buffer.from(expected)
		const current_buffer = Buffer.from(signature)

		if (expected_buffer.length !== current_buffer.length) return false

		return timingSafeEqual(expected_buffer, current_buffer)
	}

	async handleBridgeEvent(payload: unknown): Promise<ImInboundEvent | null> {
		if (!payload || typeof payload !== 'object') return null

		const body = payload as Record<string, unknown>
		const peer_id = String(body.peer_id || body.sender_id || '').trim()
		const text = String(body.text || '').trim()

		if (!peer_id || !text) return null

		const route = {
			platform: 'wechat' as const,
			account_id: this.account_id,
			chat_type: 'dm' as const,
			chat_id: peer_id,
			title: typeof body.peer_name === 'string' ? body.peer_name : undefined
		}

		const peer_key = buildImPeerKey(route)
		const state_json = JSON.stringify({
			context_token: typeof body.context_token === 'string' ? body.context_token : undefined,
			last_message_id: typeof body.message_id === 'string' ? body.message_id : undefined
		})
		const existing = await getImPeerState(
			and(
				eq(im_peer_state.platform, 'wechat'),
				eq(im_peer_state.account_id, this.account_id),
				eq(im_peer_state.peer_key, peer_key)
			)!
		)

		if (existing) {
			await setImPeerState(eq(im_peer_state.id, existing.id), { state_json })
		} else {
			await addImPeerState({
				platform: 'wechat',
				account_id: this.account_id,
				peer_key,
				state_json
			})
		}

		return {
			platform: 'wechat',
			account_id: this.account_id,
			route,
			sender: {
				id: peer_id,
				name: typeof body.sender_name === 'string' ? body.sender_name : undefined
			},
			message: {
				id: String(body.message_id || peer_id),
				text,
				raw: payload
			},
			received_at: Number(body.received_at || Date.now())
		}
	}

	async handleBridgeStatus(_payload: unknown) {}
}
