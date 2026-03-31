import type { Session } from '@core/db'
import type { LanguageModelUsage, UIDataTypes, UIMessage, UITools } from 'ai'
import type { EventEmitter } from 'events'

export type Message = UIMessage<unknown, UIDataTypes, UITools> & { createdAt?: Date }

export interface Context {
	// 用户意图
	intent: string
	// 关联核心的上下文信息
	context: string
	// 任务列表
	tasks: Array<{ title: string; status: 'pending' | 'runing' | 'done' }>
	// 关联文件
	files: Array<string>
	// 全部消息数量
	total_messages_count: number
	// 当前消息窗口数量
	current_messages_count: number
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
	| { type: 'init'; data: { session: Session; messages: Array<Message>; has_older: boolean; has_newer: boolean } }
	| { type: 'sync'; data: { session: Session; messages: Array<Message>; has_older: boolean; has_newer: boolean } }
