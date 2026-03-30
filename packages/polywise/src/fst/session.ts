import { resolve } from 'path'
import { google } from '@ai-sdk/google'
import { config, providers } from '@core/config'
import { app } from '@core/consts'
import fst_system_prompt from '@core/consts/prompts/fst_system_prompt.md'
import { agent, message, session, session_agent } from '@core/db/schema'
import { env } from '@core/env'
import { convertToModelMessages, smoothStream, stepCountIs, streamText } from 'ai'
import dayjs from 'dayjs'
import { desc, eq } from 'drizzle-orm'
import { pick } from 'es-toolkit'
import fs from 'fs-extra'
import { getId } from 'stk/utils'

import { getModel } from './provider'
import weather_tool from './tools/weather'

import type { Agent, MessageInsert, Session, SessionInsert } from '@core/db'
import type { SpecialProvider } from '@core/types'
import type { EventEmitter } from 'events'
import type { ModelResult } from './provider'
import type { ChatEventRes, InitArgs, Message, MessageMetadata } from './types'

export default class Index {
	id = ''
	event = null as unknown as EventEmitter
	session = null as unknown as Session
	model_messages = [] as Array<Message>
	ui_messages = [] as Array<Message>
	ui_offset = 0
	agents = [] as Array<Agent>
	model = null as unknown as ModelResult
	abort_controller = new AbortController()
	update_at = Date.now()

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

			await fs.ensureDir(resolve(`${app.app_path}/${this.id}`))
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
	}

	async getData() {
		this.active()

		await Promise.all([this.getModel(), this.getAgents(), this.getMessages()])

		return {
			type: 'init',
			data: { session: this.session, messages: this.ui_messages }
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

		this.model = await getModel(provider, model, target_options)
	}

	async updateSession(args: Partial<SessionInsert>) {
		this.active()

		const [res] = await env.db.update(session).set(args).where(eq(session.id, this.id)).returning()

		return res
	}

	async getMessages() {
		const res = await env.db
			.select()
			.from(message)
			.where(eq(message.session_id, this.id))
			.orderBy(desc(message.created_at))
			.limit(20)

		this.ui_messages = res.map(item => JSON.parse(item.content)).reverse()
		this.model_messages = this.ui_messages.slice(-10)
		this.ui_offset = 20
	}

	async getMoreMessages(offset: number) {
		const res = await env.db
			.select()
			.from(message)
			.where(eq(message.session_id, this.id))
			.orderBy(desc(message.created_at))
			.limit(20)
			.offset(offset)

		const older_messages = res.map(item => JSON.parse(item.content)).reverse()

		this.ui_messages = [...older_messages, ...this.ui_messages]
		this.ui_offset += 20

		return { messages: older_messages, has_more: older_messages.length === 20 }
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
		if (!this.session.is_runing && messages.length) {
			const user_message = messages.at(-1)!

			await this.insert(user_message)

			this.model_messages.push(user_message)
		}

		if (this.model_messages.length >= 16) {
			this.trimModelMessages()
		}

		this.setRunning(true)

		const target = await convertToModelMessages(this.model_messages)

		const res = streamText({
			model: this.model.model,
			// system: fst_system_prompt,
			messages: target,
			tools: {
				...this.model.tools,
				weather_tool
			},
			stopWhen: stepCountIs(60),
			abortSignal: this.abort_controller.signal,
			providerOptions: this.model.provider_options,
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
				this.active()

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

	async clear() {
		this.model_messages = []
		this.ui_messages = []

		await env.db.delete(message).where(eq(message.session_id, this.id))

		this.event.emit(`${this.id}/change`, { type: 'sync', session: this.session, messages: [] } as ChatEventRes)
	}

	private trimModelMessages() {
		this.model_messages = this.model_messages.slice(6)
	}

	private active() {
		this.update_at = Date.now()
	}

	private async setRunning(v: boolean) {
		this.session.is_runing = v

		this.event.emit(`${this.id}/change`, { type: 'sync', session: this.session } as ChatEventRes)

		await this.updateSession({ is_runing: v })
	}

	private async append(v: Message) {
		this.model_messages = [...this.model_messages, v]

		await this.insert(v)
	}

	private async insert(v: Message) {
		await env.db
			.insert(message)
			.values({ id: v.id, session_id: this.id, role: v.role, content: JSON.stringify(v) } as MessageInsert)
	}

	private async onStop() {
		this.setRunning(false)
	}
}
