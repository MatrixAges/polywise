import type { Session } from '@core/db'
import type { LanguageModelUsage, UIDataTypes, UIMessage, UITools } from 'ai'
import type { EventEmitter } from 'events'
import type { ContextInput } from './tools'

export type Message = UIMessage<unknown, UIDataTypes, UITools> & { createdAt?: Date }

export type Context = ContextInput & {
	total_messages_count: number
	current_messages_count: number
}

export interface Permission {
	tool: 'file' | 'bash' | 'glob'
	action: 'read' | 'write' | 'execute'
	path: string
}

export type Permissions = Array<Permission>

export interface InitArgs {
	id: string
	event: EventEmitter
}

export interface MessageMetadata {
	usage: LanguageModelUsage
	timestamp: number
	reasoning_duration: number
}

export type ChatEventRes =
	| {
			type: 'init'
			data: {
				session: Session
				messages: Array<Message>
				context: Context
				has_older: boolean
				has_newer: boolean
			}
	  }
	| {
			type: 'sync'
			data: {
				session: Session
				messages: Array<Message>
				context: Context
				has_older: boolean
				has_newer: boolean
			}
	  }
	| {
			type: 'permission'
			data: Permission
	  }
