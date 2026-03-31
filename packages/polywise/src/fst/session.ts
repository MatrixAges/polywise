import { resolve } from 'path'
import { config, providers } from '@core/config'
import { app } from '@core/consts'
import { getShadowContext } from '@core/consts/prompt'
import fst_system_prompt from '@core/consts/prompts/fst_system_prompt.md'
import { agent, message, session, session_agent } from '@core/db/schema'
import { env } from '@core/env'
import { convertToModelMessages, smoothStream, stepCountIs, streamText } from 'ai'
import { to } from 'await-to-js'
import dayjs from 'dayjs'
import { and, desc, eq, gt, lt, sql } from 'drizzle-orm'
import { pick } from 'es-toolkit'
import fs from 'fs-extra'
import { getId } from 'stk/utils'

import { getModel } from './provider'
import { createContextTool, createMessageTool } from './tools'

import type { Agent, MessageInsert, Session, SessionInsert } from '@core/db'
import type { SpecialProvider } from '@core/types'
import type { EventEmitter } from 'events'
import type { ModelResult } from './provider'
import type { ChatEventRes, Context, InitArgs, Message, MessageMetadata } from './types'

const ui_threshold_value = 20
const ui_reduce_value = 10
const model_threshold_value = 12
const model_reduce_value = 4

export default class Index {
	id = ''
	event = null as unknown as EventEmitter
	session = null as unknown as Session
	model = null as unknown as ModelResult

	agents = [] as Array<Agent>
	model_messages = [] as Array<Message>
	context = {} as Context

	ui_messages = [] as Array<Message>
	ui_has_older = false
	ui_has_newer = false

	abort_controller = new AbortController()
	update_at = Date.now()

	get session_dir() {
		return resolve(`${app.app_path}/sessions/${this.id}`)
	}

	get context_dir() {
		return resolve(`${this.session_dir}/context.json`)
	}

	get files_dir() {
		return resolve(`${this.session_dir}/files`)
	}

	async init(args: InitArgs) {
		const { id, event } = args

		this.id = id
		this.event = event

		await this.initSession()

		return this.getData()
	}

	async initSession() {
		let res: Session

		await fs.ensureDir(this.session_dir)
		await fs.ensureDir(this.files_dir)

		await this.getContext()

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
			data: {
				session: this.session,
				messages: this.ui_messages,
				has_older: this.ui_has_older,
				has_newer: this.ui_has_newer
			}
		} as ChatEventRes
	}

	async getSession() {
		const [res] = await env.db.select().from(session).where(eq(session.id, this.id)).limit(1)

		this.session = res

		await this.getModel()
	}

	async updateSession(args: Partial<SessionInsert>) {
		this.active()

		const [res] = await env.db.update(session).set(args).where(eq(session.id, this.id)).returning()

		return res
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

	async getMessages() {
		const res = await env.db
			.select()
			.from(message)
			.where(eq(message.session_id, this.id))
			.orderBy(desc(message.created_at))
			.limit(ui_threshold_value)

		this.ui_messages = res
			.map(item => {
				const parsed = JSON.parse(item.content)

				parsed.createdAt = item.created_at

				return parsed
			})
			.reverse()

		this.model_messages = this.ui_messages.slice(-ui_reduce_value)

		const [count_row] = await env.db
			.select({ count: sql<number>`count(*)`.as('count') })
			.from(message)
			.where(eq(message.session_id, this.id))

		const total = Number(count_row?.count ?? 0)

		this.ui_has_older = total > ui_threshold_value
		this.ui_has_newer = false
	}

	async load(type: 'prev' | 'next') {
		this.active()

		const is_older = type === 'prev'

		const has_more = is_older ? this.ui_has_older : this.ui_has_newer

		if (!has_more) return

		const boundary = is_older ? this.ui_messages[0] : this.ui_messages.at(-1)

		if (!boundary?.createdAt) return

		const condition = is_older
			? lt(message.created_at, boundary.createdAt)
			: gt(message.created_at, boundary.createdAt)

		const res = await env.db
			.select()
			.from(message)
			.where(and(eq(message.session_id, this.id), condition))
			.orderBy(desc(message.created_at))
			.limit(ui_reduce_value)

		if (!res.length) {
			if (is_older) {
				this.ui_has_older = false
			} else {
				this.ui_has_newer = false
			}
			this.emitSync()
			return
		}

		const new_messages = res
			.map(item => {
				const parsed = JSON.parse(item.content)
				parsed.createdAt = item.created_at
				return parsed
			})
			.reverse()

		if (is_older) {
			this.ui_messages = [...new_messages, ...this.ui_messages]

			if (this.ui_messages.length > ui_threshold_value) {
				this.ui_messages = this.ui_messages.slice(0, -ui_reduce_value)
				this.ui_has_newer = true
			}
		} else {
			this.ui_messages = [...this.ui_messages, ...new_messages]

			if (this.ui_messages.length > ui_threshold_value) {
				this.ui_messages = this.ui_messages.slice(ui_reduce_value)
				this.ui_has_older = true
			}
		}

		if (is_older) {
			this.ui_has_older = res.length === ui_reduce_value
		} else {
			this.ui_has_newer = res.length === ui_reduce_value
		}

		this.emitSync()
	}

	async getAgents() {
		const res = await env.db
			.select({ agent })
			.from(session_agent)
			.innerJoin(agent, eq(session_agent.agent_id, agent.id))
			.where(eq(session_agent.session_id, this.id))

		this.agents = res.map(item => item.agent)
	}

	async getContext() {
		const [err, res] = await to(fs.readJSON(this.context_dir))

		if (err) return

		this.context = res
	}

	async setContext(v: Partial<Context>) {
		this.context = {
			...this.context,
			...v,
			total_messages_count: this.context.total_messages_count,
			current_messages_count: this.context.current_messages_count
		} as Context

		console.log(this.context)

		const [err] = await to(fs.writeJSON(this.context_dir, this.context, { spaces: 4 }))

		if (err) return

		return this.context
	}

	async getStream(message: Message) {
		this.context.total_messages_count = await this.getTotalMessagesCount()
		this.context.current_messages_count = this.model_messages.length

		if (!this.session.is_runing) {
			await this.insert(message)

			this.model_messages.push(message)
			this.ui_messages.push(message)
		}

		if (this.model_messages.length >= model_threshold_value) {
			this.trimModelMessages()
		}

		this.setRunning(true)

		const target = await convertToModelMessages(this.model_messages)

		const res = streamText({
			model: this.model.model,
			system: `${fst_system_prompt}\n\n${getShadowContext(this.context)}`,
			messages: target,
			tools: {
				...this.model.tools,
				message_tool: createMessageTool(this.id, this.model_messages),
				context_tool: createContextTool(this)
			},
			stopWhen: stepCountIs(300),
			abortSignal: this.abort_controller.signal,
			providerOptions: this.model.provider_options,
			experimental_transform: smoothStream(),
			onAbort: this.onStop.bind(this),
			onError: this.onStop.bind(this)
		})

		let reasoning_start = 0
		let reasoning_end = 0

		return res.toUIMessageStream({
			originalMessages: [message],
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
		this.ui_has_older = false
		this.ui_has_newer = false
		this.context = {} as Context

		await this.setContext({})

		await env.db.delete(message).where(eq(message.session_id, this.id))

		this.emitSync()
	}

	private trimModelMessages() {
		this.model_messages = this.model_messages.slice(model_reduce_value)
	}

	private async getTotalMessagesCount() {
		const [{ count }] = await env.db
			.select({ count: sql<number>`count(*)` })
			.from(message)
			.where(eq(message.session_id, this.id))

		return Number(count)
	}

	private active() {
		this.update_at = Date.now()
	}

	private emitSync() {
		this.event.emit(`${this.id}/change`, {
			type: 'sync',
			data: {
				session: this.session,
				messages: this.ui_messages,
				has_older: this.ui_has_older,
				has_newer: this.ui_has_newer
			}
		} as ChatEventRes)
	}

	private async setRunning(v: boolean) {
		this.session.is_runing = v

		this.event.emit(`${this.id}/change`, {
			type: 'sync',
			data: {
				session: this.session,
				messages: this.ui_messages,
				has_older: this.ui_has_older,
				has_newer: this.ui_has_newer
			}
		} as ChatEventRes)

		await this.updateSession({ is_runing: v })
	}

	private async append(v: Message) {
		this.model_messages.push(v)
		this.ui_messages.push(v)

		if (this.ui_messages.length >= ui_threshold_value) {
			this.ui_messages = this.ui_messages.slice(ui_reduce_value)
			this.ui_has_older = true
		}

		this.emitSync()

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
