import { config, providers } from '@core/config'
import { agent, message, session, session_agent } from '@core/db/schema'
import { env } from '@core/env'
import { convertToModelMessages, smoothStream, streamText } from 'ai'
import dayjs from 'dayjs'
import { desc, eq } from 'drizzle-orm'
import { pick } from 'es-toolkit'
import { getId } from 'stk/utils'

import { getModel } from './provider'

import type { Agent, MessageInsert, Session, SessionInsert } from '@core/db'
import type { SpecialProvider } from '@core/types'
import type { LanguageModel } from 'ai'
import type { EventEmitter } from 'events'
import type { ChatEventRes, InitArgs, Message, MessageMetadata } from './types'

export default class Index {
	id = ''
	event = null as unknown as EventEmitter
	messages = [] as Array<Message>
	session = null as unknown as Session
	agents = [] as Array<Agent>
	model = null as unknown as LanguageModel
	abort_controller = new AbortController()

	async init(args: InitArgs) {
		const { id, event } = args

		this.id = id
		this.event = event

		await this.initSession()

		return this.getData()
	}

	async initSession() {
		let res: Session

		const [res_exsit] = await env.db.select().from(session).where(eq(session.id, this.id)).limit(1)

		if (res_exsit) {
			res = res_exsit
		} else {
			const [res_insert] = await env.db
				.insert(session)
				.values({
					id: this.id,
					title: `Session ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`
				})
				.returning()

			res = res_insert
		}

		this.session = res

		await this.getModel()
	}

	async getData() {
		await this.getMessages()

		return {
			type: 'init',
			data: { session: this.session, messages: this.messages }
		} as ChatEventRes
	}

	async getSession() {
		const [res] = await env.db.select().from(session).where(eq(session.id, this.id)).limit(1)

		this.session = res

		await this.getModel()
	}

	async getModel() {
		const { provider, model } = config.default_model

		const all_providers = [...providers.providers, ...(providers.custom_providers || [])]
		const target_provider = all_providers.find(item => item.name === provider)

		let target_options

		if (target_provider) {
			target_options = {
				...pick(target_provider, ['apiKey', 'baseURL']),
				...(target_provider as SpecialProvider)['custom_fields']
			}
		}

		console.log(provider, model, target_options)

		this.model = await getModel(provider, model, target_options)
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

	async getAgents() {
		const res = await env.db
			.select({ agent })
			.from(session_agent)
			.innerJoin(agent, eq(session_agent.agent_id, agent.id))
			.where(eq(session_agent.session_id, this.id))

		this.agents = res.map(item => item.agent)
	}

	async getStream(messages: Array<Message>) {
		this.messages = messages

		this.setRunning(true)

		const target = await convertToModelMessages(messages)

		console.log('--------')
		console.log(JSON.stringify(target))

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

		this.event.emit(`${this.id}/change`, { type: 'sync', session: this.session } as ChatEventRes)

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
