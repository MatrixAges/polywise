import type { Session } from '@core/db'
import type { LanguageModelUsage, UIDataTypes, UIMessage, UITools } from 'ai'
import type { EventEmitter } from 'events'

export type Message = UIMessage<unknown, UIDataTypes, UITools> & { createdAt?: Date }

export interface Context {
	intent: string
	context: string
	tasks: Array<{
		title: string
		desc: string
		status: 'draft' | 'pending' | 'processing' | 'done' | 'error' | 'archive'
		result?: string
		error?: string
	}>
	files: Array<{
		path: string
		desc: string
		status?: 'read' | 'modified' | 'created' | 'deleted'
		summary?: string
	}>
	total_messages_count: number
	current_messages_count: number
	constraints?: Array<string>
	lessons_learned?: Array<string>
	environment?: Record<string, string>
	blockers?: Array<string>
}

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
