import WebSocket from 'ws'

import { discord_api_base_url, discord_gateway_version, discord_max_message_length } from '../config'
import { chunkText, safeJsonParse, sleep } from '../utils'
import { BaseImAdapter } from './base'

import type { ImAccount } from '@core/db'
import type { ImInboundEvent, ImRoute, ImSendReceipt } from '../types'

interface DiscordAdapterConfig {
	token: string
	require_mention?: boolean
	allowed_guild_ids?: Array<string>
	allowed_channel_ids?: Array<string>
	allowed_user_ids?: Array<string>
}

interface DiscordGatewayPayload {
	op: number
	t?: string
	s?: number
	d?: any
}

interface DiscordChannelInfo {
	id: string
	type: number
	guild_id?: string
	parent_id?: string
	name?: string
	thread_metadata?: unknown
}

const channel_cache_ttl_ms = 5 * 60 * 1000

export default class DiscordAdapter extends BaseImAdapter {
	platform = 'discord' as const
	capabilities = {
		typing: true,
		message_edit: true,
		threads: true,
		attachments: false
	}
	config: DiscordAdapterConfig
	ws: WebSocket | null = null
	session_id = ''
	seq = 0
	heartbeat_timer: ReturnType<typeof setInterval> | null = null
	reconnect_timer: ReturnType<typeof setTimeout> | null = null
	closing = false
	bot_user_id = ''
	opening_promise: Promise<void> | null = null
	channel_cache = new Map<string, { value: DiscordChannelInfo; expires_at: number }>()
	emit_inbound: ((event: ImInboundEvent) => Promise<void>) | null = null

	constructor(account: ImAccount) {
		super(account.account_id)
		this.config = safeJsonParse(account.config_json, {
			token: '',
			require_mention: true,
			allowed_guild_ids: [],
			allowed_channel_ids: [],
			allowed_user_ids: []
		} satisfies DiscordAdapterConfig)
	}

	setInboundHandler(handler: (event: ImInboundEvent) => Promise<void>) {
		this.emit_inbound = handler
	}

	async connect() {
		if (!this.config.token) {
			throw new Error(`Discord token missing for account ${this.account_id}`)
		}

		this.closing = false
		await this.ensureSocket()
	}

	async disconnect() {
		this.closing = true

		if (this.heartbeat_timer) {
			clearInterval(this.heartbeat_timer)
			this.heartbeat_timer = null
		}

		if (this.reconnect_timer) {
			clearTimeout(this.reconnect_timer)
			this.reconnect_timer = null
		}

		this.ws?.close()
		this.ws = null
	}

	private async ensureSocket() {
		if (this.ws?.readyState === WebSocket.OPEN) return
		if (this.opening_promise) return this.opening_promise

		this.opening_promise = this.openSocket().finally(() => {
			this.opening_promise = null
		})

		return this.opening_promise
	}

	private async openSocket() {
		const response = await fetch(`${discord_api_base_url}/gateway/bot`, {
			headers: { Authorization: `Bot ${this.config.token}` }
		})

		if (!response.ok) {
			throw new Error(`Discord gateway discovery failed: ${response.status} ${await response.text()}`)
		}

		const body = (await response.json()) as { url: string }
		const url = `${body.url}?v=${discord_gateway_version}&encoding=json`

		await new Promise<void>((resolve, reject) => {
			const ws = new WebSocket(url)
			let settled = false
			this.ws = ws

			ws.on('open', () => {
				settled = true
				resolve()
			})
			ws.on('message', data => {
				void this.handleGatewayMessage(String(data)).catch(() => null)
			})
			ws.on('close', () => {
				void this.handleSocketClose().catch(() => null)
			})
			ws.on('error', err => {
				if (settled) return
				reject(err)
			})
		})
	}

	private async handleSocketClose() {
		if (this.heartbeat_timer) {
			clearInterval(this.heartbeat_timer)
			this.heartbeat_timer = null
		}

		this.ws = null

		if (this.closing) return

		this.scheduleReconnect()
	}

	private scheduleReconnect(delay_ms = 1500, clear_session = false) {
		if (clear_session) {
			this.session_id = ''
			this.seq = 0
		}

		if (this.closing || this.reconnect_timer) return

		this.reconnect_timer = setTimeout(() => {
			this.reconnect_timer = null
			void this.ensureSocket().catch(() => {
				this.scheduleReconnect(3000, true)
			})
		}, delay_ms)
	}

	private sendGateway(payload: Record<string, unknown>) {
		this.ws?.send(JSON.stringify(payload))
	}

	private async handleGatewayMessage(raw: string) {
		const payload = JSON.parse(raw) as DiscordGatewayPayload

		if (typeof payload.s === 'number') {
			this.seq = payload.s
		}

		if (payload.op === 10) {
			const interval_ms = Number(payload.d?.heartbeat_interval || 30000)

			if (this.heartbeat_timer) clearInterval(this.heartbeat_timer)

			this.heartbeat_timer = setInterval(() => {
				this.sendGateway({ op: 1, d: this.seq || null })
			}, interval_ms)

			if (this.session_id) {
				this.sendGateway({
					op: 6,
					d: {
						token: this.config.token,
						session_id: this.session_id,
						seq: this.seq
					}
				})
			} else {
				this.sendGateway({
					op: 2,
					d: {
						token: this.config.token,
						intents: 33281,
						properties: {
							os: process.platform,
							browser: 'polywise',
							device: 'polywise'
						}
					}
				})
			}

			return
		}

		if (payload.op === 7) {
			this.ws?.close()
			return
		}

		if (payload.op === 9) {
			this.session_id = ''
			this.seq = 0
			this.ws?.close()
			return
		}

		if (payload.op === 11) {
			return
		}

		if (payload.t === 'READY') {
			this.session_id = String(payload.d?.session_id || '')
			this.bot_user_id = String(payload.d?.user?.id || '')
			return
		}

		if (payload.t === 'RESUMED') {
			return
		}

		if (payload.t === 'MESSAGE_CREATE') {
			await this.handleMessageCreate(payload.d)
		}
	}

	private async api(path: string, init?: RequestInit) {
		const response = await fetch(`${discord_api_base_url}${path}`, {
			...init,
			headers: {
				Authorization: `Bot ${this.config.token}`,
				'Content-Type': 'application/json',
				...(init?.headers ?? {})
			}
		})

		if (!response.ok) {
			throw new Error(`Discord API failed: ${response.status} ${await response.text()}`)
		}

		return response
	}

	private async getChannelInfo(channel_id: string) {
		const cached = this.channel_cache.get(channel_id)

		if (cached && cached.expires_at > Date.now()) {
			return cached.value
		}

		const response = await this.api(`/channels/${channel_id}`, { method: 'GET' })
		const body = (await response.json()) as DiscordChannelInfo

		this.channel_cache.set(channel_id, {
			value: body,
			expires_at: Date.now() + channel_cache_ttl_ms
		})

		return body
	}

	private cleanMessageText(text: string) {
		if (!this.bot_user_id) return text.trim()

		return text.replace(new RegExp(`<@!?${this.bot_user_id}>`, 'g'), '').trim()
	}

	private isMentioned(message: Record<string, any>) {
		const mentions = Array.isArray(message.mentions) ? message.mentions : []
		return mentions.some(item => String(item?.id || '') === this.bot_user_id)
	}

	private isReplyToSelf(message: Record<string, any>) {
		const referenced = message.referenced_message
		return String(referenced?.author?.id || '') === this.bot_user_id
	}

	private isAllowedGuild(message: Record<string, any>) {
		if (!message.guild_id) return true
		if (!this.config.allowed_guild_ids?.length) return true
		return this.config.allowed_guild_ids.includes(String(message.guild_id))
	}

	private isAllowedChannel(channel_id: string) {
		if (!this.config.allowed_channel_ids?.length) return true
		return this.config.allowed_channel_ids.includes(channel_id)
	}

	private isAllowedUser(user_id: string) {
		if (!this.config.allowed_user_ids?.length) return true
		return this.config.allowed_user_ids.includes(user_id)
	}

	private async handleMessageCreate(message: Record<string, any>) {
		const author_id = String(message.author?.id || '')
		const channel_id = String(message.channel_id || '')

		if (!author_id || !channel_id) return
		if (author_id === this.bot_user_id) return
		if (message.author?.bot) return
		if (!this.isAllowedGuild(message)) return
		if (!this.isAllowedChannel(channel_id)) return
		if (!this.isAllowedUser(author_id)) return

		const in_dm = !message.guild_id
		const should_handle =
			in_dm || !this.config.require_mention || this.isMentioned(message) || this.isReplyToSelf(message)

		if (!should_handle) return

		const info = in_dm ? null : await this.getChannelInfo(channel_id)
		const is_thread = Boolean(info?.parent_id) || [10, 11, 12].includes(Number(info?.type || 0))
		const route = {
			platform: 'discord' as const,
			account_id: this.account_id,
			chat_type: in_dm ? ('dm' as const) : is_thread ? ('thread' as const) : ('channel' as const),
			chat_id: channel_id,
			parent_chat_id: is_thread ? String(info?.parent_id || '') || undefined : undefined,
			guild_id: typeof message.guild_id === 'string' ? message.guild_id : undefined,
			thread_id: is_thread ? channel_id : undefined,
			title: typeof info?.name === 'string' ? info.name : undefined
		}
		const text = this.cleanMessageText(String(message.content || '').trim())

		if (!text) return

		await this.emit_inbound?.({
			platform: 'discord',
			account_id: this.account_id,
			route,
			sender: {
				id: author_id,
				name:
					String(message.member?.nick || '').trim() ||
					String(message.author?.global_name || '').trim() ||
					String(message.author?.username || '').trim() ||
					author_id
			},
			message: {
				id: String(message.id || ''),
				text,
				reply_to_id:
					typeof message?.message_reference?.message_id === 'string'
						? message.message_reference.message_id
						: undefined,
				raw: message
			},
			received_at: Date.now()
		})
	}

	async sendTyping(route: ImRoute) {
		const target_id = route.chat_type === 'thread' ? route.thread_id || route.chat_id : route.chat_id
		await this.api(`/channels/${target_id}/typing`, { method: 'POST' })
	}

	async sendMessage(args: { route: ImRoute; text: string }): Promise<ImSendReceipt> {
		const target_id =
			args.route.chat_type === 'thread' ? args.route.thread_id || args.route.chat_id : args.route.chat_id
		const chunks = chunkText(args.text, discord_max_message_length)
		let receipt = {} as ImSendReceipt
		const part_ids = [] as Array<string>

		for (const chunk of chunks) {
			const response = await this.api(`/channels/${target_id}/messages`, {
				method: 'POST',
				body: JSON.stringify({ content: chunk })
			})
			const body = await response.json()
			const message_id = typeof body?.id === 'string' ? body.id : ''

			if (message_id) {
				part_ids.push(message_id)
			}

			receipt = {
				id: receipt.id || message_id || undefined,
				part_ids: [...part_ids],
				raw: body
			}
		}

		return receipt
	}

	async editMessage(args: { route: ImRoute; receipt: ImSendReceipt; text: string }): Promise<ImSendReceipt> {
		const target_id =
			args.route.chat_type === 'thread' ? args.route.thread_id || args.route.chat_id : args.route.chat_id

		if (!args.receipt.id) {
			return this.sendMessage({ route: args.route, text: args.text })
		}

		const chunks = chunkText(args.text, discord_max_message_length)
		const existing_part_ids = args.receipt.part_ids?.length
			? args.receipt.part_ids.filter(Boolean)
			: [args.receipt.id].filter(Boolean)
		const next_part_ids = [] as Array<string>
		let receipt: ImSendReceipt = {
			id: args.receipt.id,
			part_ids: existing_part_ids,
			raw: args.receipt.raw
		}

		for (const [index, chunk] of chunks.entries()) {
			const message_id = existing_part_ids[index]

			if (message_id) {
				const response = await this.api(`/channels/${target_id}/messages/${message_id}`, {
					method: 'PATCH',
					body: JSON.stringify({ content: chunk || '' })
				})
				const body = await response.json()
				const resolved_id = typeof body?.id === 'string' ? body.id : message_id
				next_part_ids.push(resolved_id)
				receipt = {
					id: next_part_ids[0] || receipt.id,
					part_ids: [...next_part_ids],
					raw: body
				}
				continue
			}

			const response = await this.api(`/channels/${target_id}/messages`, {
				method: 'POST',
				body: JSON.stringify({ content: chunk })
			})
			const body = await response.json()
			const created_id = typeof body?.id === 'string' ? body.id : ''

			if (created_id) {
				next_part_ids.push(created_id)
			}

			receipt = {
				id: next_part_ids[0] || receipt.id,
				part_ids: [...next_part_ids],
				raw: body
			}
		}

		return receipt
	}
}
