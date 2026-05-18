import type { Session } from '@core/db'
import type { LanguageModelUsage, UIDataTypes, UIMessage, UITools } from 'ai'
import type { EventEmitter } from 'events'
import type { ContextInput } from './tools'

export type MessagePartDurationTargetType =
	| 'text'
	| 'reasoning'
	| 'dynamic-tool'
	| `tool-${string}`
	| 'source-url'
	| 'source-document'
	| 'file'

export interface MessagePartDurationData {
	targetId: string
	targetType: MessagePartDurationTargetType
	duration: number
}

export interface MessageDataParts extends UIDataTypes {
	'part-duration': MessagePartDurationData
}

export interface MessageMetadata {
	usage?: LanguageModelUsage
	timestamp: number
	sender?: string
	sender_id?: string
	sender_role?: string
	group_id?: string
	group_name?: string
	group_turn_id?: string
	leadership?: 'none' | 'advisory'
}

export type Message = UIMessage<MessageMetadata, MessageDataParts, UITools> & { createdAt?: Date }

export interface MessagePartDurationUIPart {
	type: 'data-part-duration'
	id?: string
	data: MessagePartDurationData
}

export type Context = ContextInput & {
	total_messages_count: number
	current_messages_count: number
	session_auto_title?: string
	session_title_source?: 'ai' | 'human'
}

export interface Permission {
	tool: 'file' | 'bash' | 'glob' | 'edit'
	action: 'read' | 'write' | 'execute'
	path: string
}

export type Permissions = Array<Permission>

export interface InitArgs {
	id: string
	event: EventEmitter
	is_cron?: boolean
	title?: string
}

export interface SkillMeta {
	name: string
	description: string
}

export interface CustomToolMeta {
	name: string
	description: string
}

export interface SessionScope {
	type: 'global' | 'project' | 'agent' | 'group'
	id: string | null
}

export type SessionMode = 'normal' | 'plan' | 'plan-exec'
export type SessionAuditMode = 'limited' | 'auto' | 'full'

export type ChatEventRes = {
	type: 'sync'
	data: {
		session: Session
		messages: Array<Message>
		context: Context
		archived_at: null | number
		has_older: boolean
		has_newer: boolean
		permission: Permission | null
		mode: SessionMode
		audit_mode: SessionAuditMode
		group?: {
			id: string
			name: string
			description: string | null
			agents: Array<{
				id: string
				name: string
				role: string
				photo: Uint8Array | null
				avatar?: unknown
			}>
		}
	}
}
