import { EventEmitter } from 'events'
import { resolve } from 'path'
import { app } from '@core/consts'
import { session } from '@core/db/schema'
import { env } from '@core/env'
import dayjs from 'dayjs'
import { eq } from 'drizzle-orm'
import fs from 'fs-extra'

import append from './append'
import clear from './clear'
import getAgents from './getAgents'
import getContext from './getContext'
import getMessages from './getMessages'
import getModel from './getModel'
import getSession from './getSession'
import getStream from './getStream'
import getTasks from './getTasks'
import getTotalMessagesCount from './getTotalMessagesCount'
import insertMessage from './insertMessage'
import loadMessages from './loadMessages'
import setContext from './setContext'
import setTasks from './setTasks'
import updateSession from './updateSession'

import type { Agent, Session, SessionInsert } from '@core/db'
import type { ModelResult } from '../provider'
import type { ChatEventRes, Context, InitArgs, Message } from '../types'

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
				context: this.context,
				has_older: this.ui_has_older,
				has_newer: this.ui_has_newer
			}
		} as ChatEventRes
	}

	getSession = () => getSession(this)
	updateSession = (args: Partial<SessionInsert>) => updateSession(this, args)
	getModel = () => getModel(this)
	getMessages = () => getMessages(this)
	loadMessages = (type: 'prev' | 'next') => loadMessages(this, type)
	getAgents = () => getAgents(this)
	getTasks = () => getTasks(this)
	setTasks = (v: Array<Context['tasks'][number]>) => setTasks(this, v)
	getContext = () => getContext(this)
	setContext = (v: Partial<Context>) => setContext(this, v)
	getTotalMessagesCount = () => getTotalMessagesCount(this)
	insertMessage = (v: Message) => insertMessage(this, v)
	clear = () => clear(this)

	active = () => {
		this.update_at = Date.now()
	}

	emitSync = () => {
		this.event.emit(`${this.id}/change`, {
			type: 'sync',
			data: {
				session: this.session,
				messages: this.ui_messages,
				context: this.context,
				has_older: this.ui_has_older,
				has_newer: this.ui_has_newer
			}
		} as ChatEventRes)
	}

	setRunning = async (v: boolean) => {
		this.session.is_runing = v

		this.emitSync()

		await this.updateSession({ is_runing: v })
	}

	append = (v: Message) => append(this, v)

	onStop = async () => {
		await this.setRunning(false)
	}

	trimModelMessages = () => {
		this.model_messages = this.model_messages.slice(4)
	}

	abort = async () => {
		await this.setRunning(false)

		this.abort_controller.abort()
	}

	getStream = (message: Message) => {
		return getStream(this, message)
	}
}
