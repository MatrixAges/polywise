import { EventEmitter } from 'events'
import { resolve } from 'path'
import { app } from '@core/consts'

import abortStream from './abortStream'
import active from './active'
import appendMessage from './appendMessage'
import clearMessages from './clearMessages'
import getAgents from './getAgents'
import getContext from './getContext'
import getData from './getData'
import getMessages from './getMessages'
import getMessagesCount from './getMessagesCount'
import getModel from './getModel'
import getSession from './getSession'
import getStream from './getStream'
import getTasks from './getTasks'
import initSession from './initSession'
import insertMessage from './insertMessage'
import loadMessages from './loadMessages'
import runing from './runing'
import setContext from './setContext'
import setTasks from './setTasks'
import stop from './stop'
import sync from './sync'
import trimMessages from './trimMessages'
import updateSession from './updateSession'

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
	setTasks = (v: Array<Context['tasks'][number]>) => setTasks(this, v)

	getContext = () => getContext(this)
	setContext = (v: Partial<Context>) => setContext(this, v)

	getStream = (message: Message) => getStream(this, message)
	abortStream = () => abortStream(this)

	runing = (v: boolean) => runing(this, v)
	active = () => active(this)
	sync = () => sync(this)
	stop = () => stop(this)
}
