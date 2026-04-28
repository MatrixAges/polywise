import events from 'events'
import path from 'path'
import { app } from '@core/consts'

import { loadMcpTools } from '../mcp'
import { loadCustomToolsMap } from '../tools/meta'
import { loadSkillMap } from '../tools/skill'
import { getConfig } from './config'
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
import { active, clearPlan, resetAbort, runing, stop, sync } from './utils'

import type { Agent, Project, Session, SessionInsert } from '@core/db'
import type { ModelResult } from '../provider'
import type {
	Context,
	CustomToolMeta,
	InitArgs,
	Message,
	Permission,
	Permissions,
	SessionScope,
	SkillMeta
} from '../types'

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
	custom_tools_map = [] as Array<CustomToolMeta>
	mcp_tools = {} as Record<string, unknown>

	ui_messages = [] as Array<Message>
	ui_has_older = false
	ui_has_newer = false

	abort_controller = new AbortController()
	update_at = Date.now()
	archived_at = null as null | number
	superego_append_count = 0

	get scope(): SessionScope {
		if (this.project) {
			return { type: 'project', id: this.project.id }
		}

		if (this.agents.length > 0) {
			return { type: 'agent', id: this.agents[0].id }
		}

		return { type: 'global', id: null }
	}

	get session_dir() {
		return path.resolve(`${app.app_path}/sessions/${this.id}`)
	}

	get context_dir() {
		return path.resolve(`${this.session_dir}/context.json`)
	}

	get config_dir() {
		return path.resolve(`${this.session_dir}/config.json`)
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
		if (this.project?.dir) return ''

		return path.resolve(app.app_path, 'skills')
	}

	get tools_dir() {
		return path.resolve(app.app_path, 'tools')
	}

	async init(args: InitArgs) {
		const { id, event, is_cron, title } = args

		this.id = id
		this.event = event

		await this.initSession(is_cron, title)

		this.cwd = this.project?.dir || this.files_dir

		await this.loadSkillMap()
		await this.loadCustomToolsMap()

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
	clearPlan = () => clearPlan(this)

	getContext = () => getContext(this)
	getConfig = () => getConfig(this)
	setContext = (v: Partial<Context>) => setContext(this, v)
	getState = () => getState(this)
	setState = () => setState(this)

	loadSkillMap = () => loadSkillMap(this)
	loadCustomToolsMap = () => loadCustomToolsMap(this)
	loadMcps = () => loadMcpTools(this)

	getStream = (message: Message) => getStream(this, message)
	abortStream = () => abortStream(this)

	active = () => active(this)
	runing = (v: boolean) => runing(this, v)
	sync = () => sync(this)
	stop = () => stop(this)
	resetAbort = () => resetAbort(this)
}
