import { EventEmitter } from 'events'
import { resolve } from 'path'
import { app } from '@core/consts'

import { getContext, setContext } from './context'
import { appendMessage, insertMessage } from './message'
import { clearMessages, getMessages, getMessagesCount, loadMessages, trimMessages } from './messages'
import { getAgents, getData, getModel } from './related'
import { getSession, initSession, updateSession } from './session'
import { abortStream, getStream } from './stream'
import { getTasks, setTasks } from './task'
import { active, runing, stop, sync } from './utils'

import type { Agent, Session, SessionInsert } from '@core/db'
import type { ModelResult } from '../provider'
import type { Context, InitArgs, Message } from '../types'

export default class Index {
	id = ''
	event = null as unknown as EventEmitter
	session = null as unknown as Session
	model = null as unknown as ModelResult

	agents = [] as Array<Agent>
	model_messages = [] as Array<Message>
	context = {} as Context
	prefill = ''

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

	get context_history_dir() {
		return resolve(`${this.session_dir}/context_history`)
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

	initSession = () => initSession(this)
	getSession = () => getSession(this)
	updateSession = (args: Partial<SessionInsert>) => updateSession(this, args)

	getData = () => getData(this)
	getAgents = () => getAgents(this)
	getModel = () => getModel(this)

	getMessages = () => getMessages(this)
	loadMessages = (type: 'prev' | 'next') => loadMessages(this, type)
	trimMessages = () => trimMessages(this)
	clearMessages = () => clearMessages(this)
	getMessagesCount = () => getMessagesCount(this)

	insertMessage = (v: Message) => insertMessage(this, v)
	appendMessage = (v: Message) => appendMessage(this, v)

	getTasks = () => getTasks(this)
	setTasks = (v: Context['tasks']) => setTasks(this, v)

	getContext = () => getContext(this)
	setContext = (v: Partial<Context>) => setContext(this, v)

	getStream = (message: Message) => getStream(this, message)
	abortStream = () => abortStream(this)

	runing = (v: boolean) => runing(this, v)
	active = () => active(this)
	sync = () => sync(this)
	stop = () => stop(this)
}
