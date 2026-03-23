import { message, session } from '@core/db/schema'
import { env } from '@core/env'
import { convertToModelMessages, smoothStream, streamText } from 'ai'
import { desc, eq } from 'drizzle-orm'
import { getId } from 'stk/utils'

import { getModel } from './provider'

import type { MessageInsert, Session, SessionInsert } from '@core/db'
import type { LanguageModel } from 'ai'
import type { EventEmitter } from 'events'
import type { ChatEventRes, InitArgs, Message, MessageMetadata } from './types'

export default class Index {
	id = ''
	event = null as unknown as EventEmitter
	messages = [] as Array<Message>
	session = null as unknown as Session
	model = null as unknown as LanguageModel
	abort_controller = new AbortController()

	async init(args: InitArgs) {
		const { id, event } = args

		this.id = id
		this.event = event

		await this.getData()

		return { type: 'init', data: { session: this.session, messages: this.messages } } as ChatEventRes
	}

	async getData() {
		await this.getSession()
		await this.getMessages()
	}

	async getSession() {
		const [res] = await env.db.select().from(session).where(eq(session.id, this.id)).limit(1)

		this.session = res
	}

	async updateSession(args: Partial<SessionInsert>) {
		const [res] = await env.db.update(session).set(args).where(eq(session.id, this.id)).returning()

		return res
	}

	async getMessages() {
		const res = await env.db
			.select()
			.from(message)
			.where(eq(message.session_id, this.id))
			.orderBy(desc(message.created_at))
			.limit(10)

		this.messages = res.map(item => JSON.parse(item.content)).reverse()
	}

	async getModel() {
		const { provider, model, options } = this.session

		this.model = getModel(provider, model, options)
	}

	async getStream(messages: Array<Message>) {
		this.messages = messages

		this.setRunning(true)

		const target = await convertToModelMessages(messages)

		const res = streamText({
			model: this.model,
			messages: target,
			abortSignal: this.abort_controller.signal,
			experimental_transform: smoothStream(),
			onAbort: this.onStop.bind(this),
			onError: this.onStop.bind(this)
		})

		let reasoning_start = 0
		let reasoning_end = 0

		return res.toUIMessageStream({
			originalMessages: messages,
			sendSources: true,
			generateMessageId: getId,
			messageMetadata: ({ part }) => {
				if (part.type === 'reasoning-start') {
					reasoning_start = Date.now()
				}

				if (part.type === 'reasoning-end') {
					reasoning_end = Date.now()
				}

				if (part.type === 'finish') {
					const target = { usage: part.totalUsage, timestamp: Date.now() } as MessageMetadata

					if (reasoning_end) {
						target['reasoning_duration'] = reasoning_end - reasoning_start
					}

					reasoning_start = 0
					reasoning_end = 0

					return target
				}
			},
			onFinish: ({ responseMessage }) => {
				this.onStop()
				this.append(responseMessage)
			}
		})
	}

	async abort() {
		await this.setRunning(false)

		this.abort_controller.abort()
	}

	private async setRunning(v: boolean) {
		this.session.is_runing = v

		this.event.emit(`${this.id}/CHANGE`, { type: 'sync', session: this.session } as ChatEventRes)

		await this.updateSession({ is_runing: v })
	}

	private async append(v: Message) {
		this.messages = [...this.messages, v]

		await env.db
			.insert(message)
			.values({ id: v.id, session_id: this.id, role: v.role, content: JSON.stringify(v) } as MessageInsert)
	}

	private async onStop() {
		this.setRunning(false)
	}
}
