import type Session from '@core/fst/session'
import type { Message as FstMessage } from '@core/fst/types'

export type ImPlatform = 'discord' | 'wechat'
export type ImChatType = 'dm' | 'channel' | 'thread'

export interface ImRoute {
	platform: ImPlatform
	account_id: string
	chat_type: ImChatType
	chat_id: string
	parent_chat_id?: string
	guild_id?: string
	thread_id?: string
	title?: string
}

export interface ImInboundEvent {
	platform: ImPlatform
	account_id: string
	route: ImRoute
	sender: {
		id: string
		name?: string
		is_self?: boolean
	}
	message: {
		id: string
		text: string
		reply_to_id?: string
		attachments?: Array<{
			id: string
			name?: string
			url?: string
			content_type?: string
			size?: number
		}>
		raw?: unknown
	}
	received_at: number
}

export interface ImRouteState {
	route_key: string
	running: boolean
	pending: Array<ImInboundEvent>
	last_active_at: number
	drain_promise: Promise<void> | null
}

export interface ImSendReceipt {
	id?: string
	part_ids?: Array<string>
	raw?: unknown
}

export interface ImSessionBinding {
	route_key: string
	session_id: string
	session: Session
}

export interface ImAdapterCapabilities {
	typing: boolean
	message_edit: boolean
	threads: boolean
	attachments: boolean
}

export interface ImAdapterAccountConfig {
	[key: string]: unknown
}

export interface ImAdapter {
	platform: ImPlatform
	account_id: string
	capabilities: ImAdapterCapabilities
	connect(): Promise<void>
	disconnect(): Promise<void>
	sendTyping(route: ImRoute): Promise<void>
	sendMessage(args: { route: ImRoute; text: string }): Promise<ImSendReceipt>
	editMessage?(args: { route: ImRoute; receipt: ImSendReceipt; text: string }): Promise<ImSendReceipt>
	handleBridgeEvent?(payload: unknown): Promise<ImInboundEvent | null>
	handleBridgeStatus?(payload: unknown): Promise<void>
	verifyBridgePayload?(raw_body: string, signature: string | undefined): Promise<boolean>
}

export interface ImRouteExecutionResult {
	session?: Session
	response_message?: FstMessage
	final_text: string
}

export interface ImRuntime {
	adapters: Map<string, ImAdapter>
	routes: Map<string, ImRouteState>
	start(): Promise<void>
	stop(): Promise<void>
	registerAdapter(adapter: ImAdapter): void
	getAdapter(platform: ImPlatform, account_id: string): ImAdapter | null
	handleInboundEvent(event: ImInboundEvent): Promise<void>
	handleWechatBridgeEvent(raw_body: string, signature: string | undefined): Promise<{ ok: boolean; error?: string }>
	handleWechatBridgeStatus(
		raw_body: string,
		signature: string | undefined
	): Promise<{ ok: boolean; error?: string }>
	getHealth(): {
		adapters: Array<{ platform: ImPlatform; account_id: string }>
		routes: Array<{ route_key: string; running: boolean; pending: number; last_active_at: number }>
	}
}
