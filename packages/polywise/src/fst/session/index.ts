import events from 'events'
import path from 'path'
import { app } from '@core/consts'

import { loadSkillMap } from '../tools/skill'
import { getContext, setContext } from './context'
import { appendMessage, insertMessage } from './message'
import {
	archiveMessages,
	clearMessages,
	getMessages,
	getMessagesCount,
	loadMessages,
	trimMessages,
	unarchiveMessages
} from './messages'
import { getAgents, getData, getModel, getProject } from './related'
import { getSession, initSession, updateSession } from './session'
import { getState, setState } from './state'
import { abortStream, getStream } from './stream'
import { clearTasks, getTasks, setTasks } from './task'
import { active, runing, stop, sync } from './utils'

import type { Agent, Project, Session, SessionInsert } from '@core/db'
import type { ModelResult } from '../provider'
import type { Context, InitArgs, Message, Permission, Permissions, SkillMeta } from '../types'

export default class Index {
	id = ''
	event = null as unknown as events.EventEmitter
	session = null as unknown as Session
	model = null as unknown as ModelResult

	agents = [] as Array<Agent>
	project = null as Project | null
	model_messages = [] as Array<Message>
	context = {} as Context
	cwd = ''
	prefill = ''

	permission = null as Permission | null
	permissions = [] as Permissions

	skill_map = [] as Array<SkillMeta>

	ui_messages = [] as Array<Message>
	ui_has_older = false
	ui_has_newer = false

	abort_controller = new AbortController()
	update_at = Date.now()
	archived_at = null as null | number

	get session_dir() {
		return path.resolve(`${app.app_path}/sessions/${this.id}`)
	}

	get context_dir() {
		return path.resolve(`${this.session_dir}/context.json`)
	}

	get state_dir() {
		return path.resolve(`${this.session_dir}/state.json`)
	}

	get context_history_dir() {
		return path.resolve(`${this.session_dir}/context_history`)
	}

	get files_dir() {
		return path.resolve(`${this.session_dir}/files`)
	}

	get skills_dir() {
		if (this.project?.dir) {
			return path.resolve(this.project.dir, 'skills')
		}

		return path.resolve(app.app_path, 'skills')
	}

	async init(args: InitArgs) {
		const { id, event, is_cron, title } = args

		this.id = id
		this.event = event

		await this.initSession(is_cron, title)

		this.cwd = this.project?.dir || this.files_dir

		await this.loadSkillMap()

		return this.getData()
	}

	initSession = (is_cron?: boolean, title?: string) => initSession(this, is_cron, title)
	getSession = () => getSession(this)
	updateSession = (args: Partial<SessionInsert>) => updateSession(this, args)

	getData = () => getData(this)
	getAgents = () => getAgents(this)
	getModel = () => getModel(this)
	getProject = () => getProject(this)

	getMessages = () => getMessages(this)
	loadMessages = (type: 'prev' | 'next') => loadMessages(this, type)
	trimMessages = () => trimMessages(this)
	clearMessages = () => clearMessages(this)
	archiveMessages = () => archiveMessages(this)
	unarchiveMessages = () => unarchiveMessages(this)
	getMessagesCount = () => getMessagesCount(this)

	insertMessage = (v: Message) => insertMessage(this, v)
	appendMessage = (v: Message) => appendMessage(this, v)

	getTasks = () => getTasks(this)
	setTasks = (v: Context['tasks']) => setTasks(this, v)
	clearTasks = () => clearTasks(this)

	getContext = () => getContext(this)
	setContext = (v: Partial<Context>) => setContext(this, v)
	getState = () => getState(this)
	setState = () => setState(this)

	loadSkillMap = () => loadSkillMap(this)

	getStream = (message: Message) => getStream(this, message)
	abortStream = () => abortStream(this)

	active = () => active(this)
	runing = (v: boolean) => runing(this, v)
	sync = () => sync(this)
	stop = () => stop(this)

	resetAbort = () => {
		this.abort_controller = new AbortController()
	}
}
