import type { LanguageModelUsage, UIDataTypes, UIMessage, UITools } from 'ai'
import type { EventEmitter } from 'events'

export type Message = UIMessage<unknown, UIDataTypes, UITools>

export interface ArgsInit {
	id: string
	event: EventEmitter
	read: (args: { filename: string; module?: string; ext?: string }) => Promise<any>
	write: (args: {
		filename: string
		data: any
		module?: string
		ext?: string
		merge?: boolean
		default_value?: any
	}) => Promise<void>
}

export interface ChatOptions {
	type: 'chat' | 'role'
	question: string
	model: { provider: string; group: string; label: string; value: string }
	system_prompt: string
	prompt_rewriting: boolean
	web_search_enabled: boolean
	web_search_engine: string
	temperature: number
	top_p: number
	max_ouput_tokens: number
}

export interface MessageMetadata {
	usage: LanguageModelUsage
	timestamp: number
	reasoning_duration: number
}

export type ChatEventRes =
	| { type: 'ask'; question: string }
	| { type: 'init'; messages: Array<Message> }
	| { type: 'getData'; data: { loading: boolean; options: ChatOptions; messages: Array<Message> } }
	| { type: 'sync_options'; options: ChatOptions }
	| { type: 'sync_loading'; loading: boolean }
