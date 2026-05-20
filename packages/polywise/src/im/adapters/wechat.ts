import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { im_peer_state } from '@core/db/schema'
import { addImPeerState, getImPeerState, setImPeerState } from '@core/db/services'
import { and, eq } from 'drizzle-orm'

import {
	wechat_bridge_send_path,
	wechat_bridge_typing_path,
	wechat_clawbot_api_base_url,
	wechat_clawbot_channel_version
} from '../config'
import { buildImPeerKey } from '../route'
import { safeJsonParse, sleep } from '../utils'
import { BaseImAdapter } from './base'

import type { ImAccount } from '@core/db'
import type { ImInboundEvent, ImRoute, ImSendReceipt } from '../types'

interface WechatAdapterConfig {
	bot_token?: string
	api_base_url?: string
	bridge_base_url?: string
	secret?: string
	send_path?: string
	typing_path?: string
}

interface WechatClawbotEnvelope<T> {
	ret?: number
	errmsg?: string
	data?: T
}

interface WechatClawbotMessageItem {
	item_type?: number
	text_item?: {
		text?: string
	}
}

interface WechatClawbotInboundMessage {
	from_user_id?: string
	from_user_nick?: string
	msg_id?: string
	client_id?: string
	context_token?: string
	message_type?: number
	message_state?: number
	recv_time?: number
	create_time?: number
	item_list?: Array<WechatClawbotMessageItem>
}

interface WechatPeerRuntimeState {
	context_token?: string
	last_message_id?: string
	typing_ticket?: string
	typing_ticket_expires_at?: number
}

const getSignature = (secret: string, raw_body: string) => createHmac('sha256', secret).update(raw_body).digest('hex')

const buildWechatUin = () => randomBytes(4).toString('base64')

const extractText = (items: Array<WechatClawbotMessageItem> | undefined) =>
	(items || [])
		.filter(item => item.item_type === 1 && typeof item.text_item?.text === 'string')
		.map(item => item.text_item!.text!.trim())
		.filter(Boolean)
		.join('\n')

const normalizeBaseUrl = (value: string) => (value.endsWith('/') ? value : `${value}/`)
const normalizeApiBaseUrl = (value: string) => {
	const normalized = normalizeBaseUrl(value)
	return /\/ilink\/bot\/?$/i.test(normalized) ? normalized : new URL('ilink/bot/', normalized).toString()
}

export default class WechatAdapter extends BaseImAdapter {
	platform = 'wechat' as const
	capabilities = {
		typing: true,
		message_edit: false,
		threads: false,
		attachments: false
	}
	config: WechatAdapterConfig
	closing = false
	poll_promise: Promise<void> | null = null
	poll_abort_controller: AbortController | null = null
	get_updates_buf = ''
	wechat_uin = buildWechatUin()
	emit_inbound: ((event: ImInboundEvent) => Promise<void>) | null = null

	constructor(account: ImAccount) {
		super(account.account_id)
		this.config = safeJsonParse(account.config_json, {
			bot_token: '',
			api_base_url: wechat_clawbot_api_base_url,
			bridge_base_url: '',
			secret: '',
			send_path: wechat_bridge_send_path,
			typing_path: wechat_bridge_typing_path
		} satisfies WechatAdapterConfig)
	}

	setInboundHandler(handler: (event: ImInboundEvent) => Promise<void>) {
		this.emit_inbound = handler
	}

	get usesClawbotDirectApi() {
		return Boolean(this.config.bot_token?.trim())
	}

	get apiBaseUrl() {
		return normalizeApiBaseUrl((this.config.api_base_url || wechat_clawbot_api_base_url).trim())
	}

	async connect() {
		if (!this.usesClawbotDirectApi) return
		if (this.poll_promise) return

		this.closing = false
		this.poll_promise = this.pollLoop().finally(() => {
			this.poll_promise = null
		})
	}

	async disconnect() {
		this.closing = true
		this.poll_abort_controller?.abort()
		await this.poll_promise?.catch(() => null)
		this.poll_abort_controller = null
	}

	private async pollLoop() {
		while (!this.closing) {
			try {
				this.poll_abort_controller = new AbortController()
				const data = await this.callClawbotApi<{
					get_updates_buf?: string
					msgs?: Array<WechatClawbotInboundMessage>
				}>('getupdates', { get_updates_buf: this.get_updates_buf }, this.poll_abort_controller.signal)

				if (typeof data?.get_updates_buf === 'string') {
					this.get_updates_buf = data.get_updates_buf
				}

				for (const message of data?.msgs || []) {
					const event = await this.handleClawbotInboundMessage(message)

					if (event && this.emit_inbound) {
						await this.emit_inbound(event)
					}
				}
			} catch (error) {
				if (this.closing) break

				if (error instanceof Error && error.name === 'AbortError') {
					break
				}

				await sleep(1500)
			} finally {
				this.poll_abort_controller = null
			}
		}
	}

	private async callClawbotApi<T>(path: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
		const token = this.config.bot_token?.trim()

		if (!token) {
			throw new Error(`WeChat ClawBot token missing for account ${this.account_id}`)
		}

		const response = await fetch(new URL(path, this.apiBaseUrl), {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				AuthorizationType: 'ilink_bot_token',
				Authorization: `Bearer ${token}`,
				'X-WECHAT-UIN': this.wechat_uin
			},
			body: JSON.stringify(body),
			signal
		})

		if (!response.ok) {
			throw new Error(`WeChat ClawBot API failed: ${response.status} ${await response.text()}`)
		}

		const json = (await response.json()) as WechatClawbotEnvelope<T>

		if (typeof json.ret === 'number' && json.ret !== 0) {
			throw new Error(json.errmsg || `WeChat ClawBot API returned ${json.ret}`)
		}

		return (json.data ?? {}) as T
	}

	private async getPeerRuntimeState(route: ImRoute) {
		const peer_key = buildImPeerKey(route)
		const record = await getImPeerState(
			and(
				eq(im_peer_state.platform, 'wechat'),
				eq(im_peer_state.account_id, this.account_id),
				eq(im_peer_state.peer_key, peer_key)
			)!
		)

		if (!record?.state_json) {
			return { record, state: {} as WechatPeerRuntimeState }
		}

		return {
			record,
			state: safeJsonParse(record.state_json, {} as WechatPeerRuntimeState)
		}
	}

	private async setPeerRuntimeState(route: ImRoute, patch: Partial<WechatPeerRuntimeState>) {
		const peer_key = buildImPeerKey(route)
		const { record, state } = await this.getPeerRuntimeState(route)
		const next_state = { ...state, ...patch }
		const state_json = JSON.stringify(next_state)

		if (record) {
			await setImPeerState(eq(im_peer_state.id, record.id), { state_json })
			return next_state
		}

		await addImPeerState({
			platform: 'wechat',
			account_id: this.account_id,
			peer_key,
			state_json
		})

		return next_state
	}

	private async ensureTypingTicket(route: ImRoute, state: WechatPeerRuntimeState) {
		if (state.typing_ticket && (state.typing_ticket_expires_at || 0) > Date.now()) {
			return state.typing_ticket
		}

		const data = await this.callClawbotApi<{ typing_ticket?: string }>('getconfig', {
			ilink_user_id: route.chat_id,
			context_token: state.context_token || ''
		})

		if (!data.typing_ticket) return null

		await this.setPeerRuntimeState(route, {
			typing_ticket: data.typing_ticket,
			typing_ticket_expires_at: Date.now() + 10 * 60 * 1000
		})

		return data.typing_ticket
	}

	private async handleClawbotInboundMessage(message: WechatClawbotInboundMessage): Promise<ImInboundEvent | null> {
		const peer_id = String(message.from_user_id || '').trim()
		const text = extractText(message.item_list)

		if (!peer_id || !text) return null
		if (message.message_type !== undefined && message.message_type !== 1) return null

		const route = {
			platform: 'wechat' as const,
			account_id: this.account_id,
			chat_type: 'dm' as const,
			chat_id: peer_id,
			title: message.from_user_nick
		}

		await this.setPeerRuntimeState(route, {
			context_token: typeof message.context_token === 'string' ? message.context_token : undefined,
			last_message_id:
				typeof message.msg_id === 'string'
					? message.msg_id
					: typeof message.client_id === 'string'
						? message.client_id
						: undefined
		})

		return {
			platform: 'wechat',
			account_id: this.account_id,
			route,
			sender: {
				id: peer_id,
				name: message.from_user_nick
			},
			message: {
				id:
					typeof message.msg_id === 'string'
						? message.msg_id
						: typeof message.client_id === 'string'
							? message.client_id
							: peer_id,
				text,
				raw: message
			},
			received_at:
				typeof message.recv_time === 'number'
					? message.recv_time
					: typeof message.create_time === 'number'
						? message.create_time
						: Date.now()
		}
	}

	private async postLegacyBridge(path: string, body: Record<string, unknown>) {
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
		if (!this.usesClawbotDirectApi) {
			if (!this.config.bridge_base_url) return

			await this.postLegacyBridge(this.config.typing_path || wechat_bridge_typing_path, {
				account_id: this.account_id,
				peer_id: route.chat_id
			})
			return
		}

		const { state } = await this.getPeerRuntimeState(route)

		if (!state.context_token) return

		const typing_ticket = await this.ensureTypingTicket(route, state)

		if (!typing_ticket) return

		await this.callClawbotApi('sendtyping', {
			ilink_user_id: route.chat_id,
			typing_ticket,
			status: 1
		})
	}

	async sendMessage(args: { route: ImRoute; text: string }): Promise<ImSendReceipt> {
		if (!this.usesClawbotDirectApi) {
			const response = await this.postLegacyBridge(this.config.send_path || wechat_bridge_send_path, {
				account_id: this.account_id,
				peer_id: args.route.chat_id,
				text: args.text
			})

			return {
				id: typeof response?.message_id === 'string' ? response.message_id : undefined,
				raw: response
			}
		}

		const client_id = randomUUID()
		const { state } = await this.getPeerRuntimeState(args.route)

		if (!state.context_token) {
			throw new Error(`WeChat ClawBot context token missing for peer ${args.route.chat_id}`)
		}

		const response = await this.callClawbotApi<{ msg_id?: string }>('sendmessage', {
			base_info: {
				channel_version: wechat_clawbot_channel_version
			},
			context_token: state.context_token,
			message: {
				from_user_id: '',
				to_user_id: args.route.chat_id,
				client_id,
				message_type: 2,
				message_state: 2,
				item_list: [
					{
						item_type: 1,
						text_item: {
							text: args.text
						}
					}
				]
			}
		})

		await this.setPeerRuntimeState(args.route, {
			last_message_id: typeof response.msg_id === 'string' ? response.msg_id : client_id
		})

		return {
			id: typeof response.msg_id === 'string' ? response.msg_id : client_id,
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
		if (this.usesClawbotDirectApi) return null
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

		await this.setPeerRuntimeState(route, {
			context_token: typeof body.context_token === 'string' ? body.context_token : undefined,
			last_message_id: typeof body.message_id === 'string' ? body.message_id : undefined
		})

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
