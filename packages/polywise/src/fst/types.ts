import type { Session } from '@core/db'
import type { LanguageModelUsage, UIDataTypes, UIMessage, UITools } from 'ai'
import type { EventEmitter } from 'events'

export type Message = UIMessage<unknown, UIDataTypes, UITools>

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
	| { type: 'init'; data: { session: Session; messages: Array<Message> } }
	| { type: 'error'; message: string }
	| { type: 'sync'; session: Session }
