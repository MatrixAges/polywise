import { createDecipheriv, createHash } from 'node:crypto'

import { feishu_api_base_url } from '../config'
import { BaseImAdapter } from './base'

import type { ImAccount } from '@core/db'
import type { ImInboundEvent, ImRoute, ImSendReceipt } from '../types'

interface FeishuAdapterConfig {
	app_id?: string
	app_secret?: string
	require_mention?: boolean
	allowed_chat_ids?: Array<string>
	allowed_user_ids?: Array<string>
	verification_token?: string
	encrypt_key?: string
}

interface FeishuTenantAccessTokenResponse {
	code?: number
	msg?: string
	tenant_access_token?: string
	expire?: number
}

interface FeishuSendMessageResponse {
	code?: number
	msg?: string
	data?: {
		message_id?: string
	}
}

interface FeishuWebhookEnvelope {
	type?: string
	challenge?: string
	token?: string
	schema?: string
	header?: {
		app_id?: string
		token?: string
		event_type?: string
		create_time?: string
	}
	event?: {
		sender?: {
			sender_id?: {
				open_id?: string
				user_id?: string
				union_id?: string
			}
			sender_type?: string
		}
		message?: {
			message_id?: string
			chat_id?: string
			chat_type?: string
			message_type?: string
			content?: string
			create_time?: string
		}
		chat?: {
			name?: string
		}
	}
	encrypt?: string
}

interface FeishuChannelMessage {
	messageId: string
	chatId: string
	chatType: 'p2p' | 'group' | 'topic'
	senderId: string
	senderName?: string
	content: string
	mentionedBot?: boolean
	mentionAll?: boolean
	replyToMessageId?: string
	threadId?: string
	createTime: number
	raw?: unknown
}

interface FeishuChatInfo {
	chatId: string
	name?: string
	description?: string
	chatType: 'p2p' | 'group'
}

interface FeishuChannel {
	connect(): Promise<void>
	disconnect(): Promise<void>
	send(to: string, input: { text: string }, opts?: { replyTo?: string }): Promise<{ messageId: string }>
	editMessage(messageId: string, text: string): Promise<void>
	getChatInfo(chatId: string): Promise<FeishuChatInfo>
	on(name: 'message', handler: (msg: FeishuChannelMessage) => void | Promise<void>): () => void
	on(name: 'error', handler: (error: unknown) => void): () => void
	on(name: 'reconnecting' | 'reconnected', handler: () => void): () => void
}

interface FeishuSdkModule {
	LoggerLevel?: {
		error?: unknown
	}
	createLarkChannel(args: {
		appId: string
		appSecret: string
		transport: 'websocket'
		source?: string
		includeRawEvent?: boolean
		loggerLevel?: unknown
		policy?: {
			groupAllowlist?: Array<string>
			dmMode?: 'open' | 'allowlist'
			dmAllowlist?: Array<string>
			requireMention?: boolean
			respondToMentionAll?: boolean
		}
	}): FeishuChannel
}

const normalizeBaseUrl = (value: string) => (value.endsWith('/') ? value : `${value}/`)
const feishu_chat_info_cache_ttl_ms = 5 * 60 * 1000

const parseJson = <T>(value: string, fallback: T): T => {
	try {
		return JSON.parse(value) as T
	} catch {
		return fallback
	}
}

const decryptFeishuPayload = (encrypt: string, encrypt_key: string) => {
	const key = createHash('sha256').update(encrypt_key).digest()
	const decipher = createDecipheriv('aes-256-cbc', key, key.subarray(0, 16))
	const decrypted = Buffer.concat([decipher.update(Buffer.from(encrypt, 'base64')), decipher.final()])
	return decrypted.toString('utf8')
}

export default class FeishuAdapter extends BaseImAdapter {
	platform = 'feishu' as const
	capabilities = {
		typing: false,
		message_edit: true,
		threads: false,
		attachments: false
	}
	config: FeishuAdapterConfig
	tenant_access_token = ''
	tenant_access_token_expires_at = 0
	channel: FeishuChannel | null = null
	unsubscribers = [] as Array<() => void>
	inbound_handler: ((event: ImInboundEvent) => Promise<void>) | null = null
	chat_cache = new Map<string, { value: FeishuChatInfo; expires_at: number }>()

	constructor(account: ImAccount) {
		super(account.account_id)
		this.config = parseJson(account.config_json || '{}', {
			app_id: '',
			app_secret: '',
			require_mention: true,
			allowed_chat_ids: [],
			allowed_user_ids: [],
			verification_token: '',
			encrypt_key: ''
		} satisfies FeishuAdapterConfig)
	}

	setInboundHandler(handler: (event: ImInboundEvent) => Promise<void>) {
		this.inbound_handler = handler
	}

	private async importSdk(): Promise<FeishuSdkModule> {
		try {
			const loader = new Function('specifier', 'return import(specifier)') as (
				specifier: string
			) => Promise<FeishuSdkModule>
			return await loader('@larksuiteoapi/node-sdk')
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)
			throw new Error(
				[
					'Feishu long connection requires the installed dependency `@larksuiteoapi/node-sdk`.',
					'Run your normal dependency install for Polywise on this machine before enabling Feishu.',
					message ? `Loader error: ${message}` : ''
				]
					.filter(Boolean)
					.join(' ')
			)
		}
	}

	private normalizeChannelMessage(message: FeishuChannelMessage): ImInboundEvent | null {
		const text = String(message.content || '').trim()
		const chat_id = String(message.chatId || '').trim()
		const sender_id = String(message.senderId || '').trim()

		if (!text || !chat_id || !sender_id) {
			return null
		}

		return {
			platform: 'feishu' as const,
			account_id: this.account_id,
			route: {
				platform: 'feishu' as const,
				account_id: this.account_id,
				chat_type: message.chatType === 'p2p' ? ('dm' as const) : ('channel' as const),
				chat_id
			},
			sender: {
				id: sender_id,
				name: message.senderName?.trim() || sender_id
			},
			message: {
				id: String(message.messageId || chat_id),
				text,
				reply_to_id: message.replyToMessageId,
				raw: message.raw
			},
			received_at: Number(message.createTime || Date.now())
		}
	}

	private isAllowedChat(message: FeishuChannelMessage) {
		if (message.chatType === 'p2p') return true
		if (!this.config.allowed_chat_ids?.length) return true
		return this.config.allowed_chat_ids.includes(String(message.chatId))
	}

	private isAllowedUser(message: FeishuChannelMessage) {
		if (!this.config.allowed_user_ids?.length) return true
		return this.config.allowed_user_ids.includes(String(message.senderId))
	}

	private shouldHandleMessage(message: FeishuChannelMessage) {
		if (message.chatType === 'p2p') return true
		if (this.config.require_mention === false) return true
		return Boolean(message.mentionedBot)
	}

	private async getChatInfo(chatId: string) {
		const cached = this.chat_cache.get(chatId)

		if (cached && cached.expires_at > Date.now()) {
			return cached.value
		}

		const value = await this.channel?.getChatInfo(chatId)

		if (value) {
			this.chat_cache.set(chatId, {
				value,
				expires_at: Date.now() + feishu_chat_info_cache_ttl_ms
			})
		}

		return value || null
	}

	async connect() {
		if (!this.appId || !this.appSecret) {
			throw new Error(`Feishu app credentials missing for account ${this.account_id}`)
		}

		if (!this.inbound_handler) {
			throw new Error(`Feishu inbound handler missing for account ${this.account_id}`)
		}

		const sdk = await this.importSdk()
		const channel = sdk.createLarkChannel({
			appId: this.appId,
			appSecret: this.appSecret,
			transport: 'websocket',
			source: 'polywise',
			includeRawEvent: true,
			loggerLevel: sdk.LoggerLevel?.error,
			policy: {
				groupAllowlist: this.config.allowed_chat_ids?.length ? this.config.allowed_chat_ids : undefined,
				dmMode: this.config.allowed_user_ids?.length ? 'allowlist' : 'open',
				dmAllowlist: this.config.allowed_user_ids?.length ? this.config.allowed_user_ids : undefined,
				requireMention: this.config.require_mention !== false,
				respondToMentionAll: false
			}
		})

		this.unsubscribers.push(
			channel.on('message', async message => {
				if (!this.isAllowedChat(message)) {
					return
				}

				if (!this.isAllowedUser(message)) {
					return
				}

				if (!this.shouldHandleMessage(message)) {
					return
				}

				const event = this.normalizeChannelMessage(message)

				if (!event) {
					return
				}

				if (event.route.chat_type !== 'dm') {
					const chat = await this.getChatInfo(event.route.chat_id).catch(() => null)
					event.route.title = chat?.name?.trim() || event.route.title
				}

				await this.inbound_handler?.(event)
			})
		)

		this.unsubscribers.push(
			channel.on('error', error => {
				console.error(`[im:feishu:${this.account_id}]`, error)
			})
		)

		this.unsubscribers.push(channel.on('reconnecting', () => undefined))
		this.unsubscribers.push(channel.on('reconnected', () => undefined))

		await channel.connect()
		this.channel = channel
	}

	async disconnect() {
		const current = this.channel
		this.channel = null
		this.chat_cache.clear()

		for (const unsubscribe of this.unsubscribers.splice(0)) {
			try {
				unsubscribe()
			} catch {}
		}

		await current?.disconnect().catch(() => null)
	}

	private get apiBaseUrl() {
		return normalizeBaseUrl(feishu_api_base_url)
	}

	private get verificationToken() {
		return this.config.verification_token?.trim() || ''
	}

	private get appId() {
		return this.config.app_id?.trim() || ''
	}

	private get appSecret() {
		return this.config.app_secret?.trim() || ''
	}

	private get encryptKey() {
		return this.config.encrypt_key?.trim() || ''
	}

	private async getTenantAccessToken() {
		if (this.tenant_access_token && this.tenant_access_token_expires_at - 30_000 > Date.now()) {
			return this.tenant_access_token
		}

		if (!this.appId || !this.appSecret) {
			throw new Error(`Feishu app credentials missing for account ${this.account_id}`)
		}

		const response = await fetch(new URL('open-apis/auth/v3/tenant_access_token/internal', this.apiBaseUrl), {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				app_id: this.appId,
				app_secret: this.appSecret
			})
		})

		if (!response.ok) {
			throw new Error(`Feishu token request failed: ${response.status} ${await response.text()}`)
		}

		const json = (await response.json()) as FeishuTenantAccessTokenResponse

		if (json.code !== 0 || !json.tenant_access_token) {
			throw new Error(json.msg || `Feishu token request failed with code ${json.code ?? 'unknown'}`)
		}

		this.tenant_access_token = json.tenant_access_token
		this.tenant_access_token_expires_at = Date.now() + Math.max((json.expire || 7200) - 60, 60) * 1000

		return this.tenant_access_token
	}

	private async feishuApi(path: string, init?: RequestInit) {
		const tenant_access_token = await this.getTenantAccessToken()
		const response = await fetch(new URL(path, this.apiBaseUrl), {
			...init,
			headers: {
				Authorization: `Bearer ${tenant_access_token}`,
				'Content-Type': 'application/json; charset=utf-8',
				...(init?.headers ?? {})
			}
		})

		if (!response.ok) {
			throw new Error(`Feishu API failed: ${response.status} ${await response.text()}`)
		}

		return response
	}

	private normalizeWebhookBody(raw_body: string) {
		const base = parseJson(raw_body, {} as FeishuWebhookEnvelope)

		if (typeof base.encrypt === 'string' && base.encrypt.trim()) {
			if (!this.encryptKey) {
				throw new Error(
					`Feishu webhook payload is encrypted for account ${this.account_id}; configure Encrypt Key`
				)
			}

			return parseJson(decryptFeishuPayload(base.encrypt, this.encryptKey), {} as FeishuWebhookEnvelope)
		}

		return base
	}

	async handleWebhookRequest(raw_body: string) {
		let body: FeishuWebhookEnvelope

		try {
			body = this.normalizeWebhookBody(raw_body)
		} catch (error) {
			return {
				matched: false,
				error: error instanceof Error ? error.message : String(error)
			}
		}

		const token = String(body.header?.token || body.token || '').trim()
		const app_id = String(body.header?.app_id || '').trim()
		const token_matches = this.verificationToken ? token === this.verificationToken : true
		const app_matches = this.appId ? !app_id || app_id === this.appId : true

		if (!token_matches || !app_matches) {
			return { matched: false }
		}

		if (body.type === 'url_verification' && typeof body.challenge === 'string') {
			return {
				matched: true,
				challenge: body.challenge
			}
		}

		if (body.header?.event_type !== 'im.message.receive_v1' || !body.event?.message) {
			return {
				matched: true
			}
		}

		const message = body.event.message
		const sender = body.event.sender
		const sender_id = String(
			sender?.sender_id?.open_id || sender?.sender_id?.user_id || sender?.sender_id?.union_id || ''
		).trim()

		if (!sender_id || sender?.sender_type === 'app') {
			return {
				matched: true
			}
		}

		if (message.message_type !== 'text') {
			return {
				matched: true
			}
		}

		const content = parseJson(message.content || '{}', { text: '' })
		const text = typeof content.text === 'string' ? content.text.trim() : ''

		if (!text) {
			return {
				matched: true
			}
		}

		const chat_id = String(message.chat_id || '').trim()

		if (!chat_id) {
			return {
				matched: true
			}
		}

		const route = {
			platform: 'feishu' as const,
			account_id: this.account_id,
			chat_type: message.chat_type === 'p2p' ? ('dm' as const) : ('channel' as const),
			chat_id,
			title: body.event?.chat?.name
		}

		return {
			matched: true,
			event: {
				platform: 'feishu' as const,
				account_id: this.account_id,
				route,
				sender: {
					id: sender_id,
					name: sender_id
				},
				message: {
					id: String(message.message_id || chat_id),
					text,
					raw: body
				},
				received_at: Number(body.header?.create_time || message.create_time || Date.now())
			} satisfies ImInboundEvent
		}
	}

	async sendTyping(_route: ImRoute) {}

	async sendMessage(args: { route: ImRoute; text: string }): Promise<ImSendReceipt> {
		if (this.channel) {
			const result = await this.channel.send(args.route.chat_id, { text: args.text })

			return {
				id: result.messageId,
				raw: result
			}
		}

		const response = await this.feishuApi(`open-apis/im/v1/messages?receive_id_type=chat_id`, {
			method: 'POST',
			body: JSON.stringify({
				receive_id: args.route.chat_id,
				msg_type: 'text',
				content: JSON.stringify({
					text: args.text
				})
			})
		})
		const body = (await response.json()) as FeishuSendMessageResponse

		if (body.code !== 0) {
			throw new Error(body.msg || `Feishu send message failed with code ${body.code ?? 'unknown'}`)
		}

		return {
			id: body.data?.message_id,
			raw: body
		}
	}

	async editMessage(args: { route: ImRoute; receipt: ImSendReceipt; text: string }): Promise<ImSendReceipt> {
		if (!args.receipt.id) {
			return this.sendMessage({ route: args.route, text: args.text })
		}

		if (this.channel) {
			await this.channel.editMessage(args.receipt.id, args.text)

			return {
				...args.receipt,
				id: args.receipt.id
			}
		}

		return args.receipt
	}
}
