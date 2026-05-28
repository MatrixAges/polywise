import events from 'events'
import path from 'path'
import { app } from '@core/consts'
import getContextPrompt from '@core/consts/prompts/getContextPrompt'

import { loadMcpTools } from '../mcp'
import { updateTitle } from '../tools'
import { loadCustomToolsMap } from '../tools/meta'
import { loadSkillMap } from '../tools/skill'
import getConfig from './config/getConfig'
import setConfig from './config/setConfig'
import createKernel from './core/createKernel'
import runHooks from './hooks/runHooks'
import appendMessage from './message/appendMessage'
import insertMessage from './message/insertMessage'
import archiveMessages from './messages/archiveMessages'
import clearMessages from './messages/clearMessages'
import getMessages from './messages/getMessages'
import getMessagesCount from './messages/getMessagesCount'
import loadMessages from './messages/loadMessages'
import removeMessage from './messages/removeMessage'
import trimMessages from './messages/trimMessages'
import unarchiveMessages from './messages/unarchiveMessages'
import getAgentsBase from './related/getAgents'
import getModel from './related/getModel'
import getOwnerAgentBase from './related/getOwnerAgent'
import getProject from './related/getProject'
import getSession from './session/getSession'
import initSession from './session/initSession'
import updateSession from './session/updateSession'
import abortStream from './stream/abortStream'
import active from './utils/active'
import clearPlan from './utils/clearPlan'
import setRunning from './utils/setRunning'

import type { Agent, Group as GroupRow, Project, SessionInsert, Session as SessionRow } from '@core/db'
import type { GroupBarrierState, GroupReplyQueueItem, GroupWriteLock } from '../domains/group/types'
import type { ModelResult } from '../provider'
import type {
	Context,
	CustomToolMeta,
	InitArgs,
	Message,
	Permission,
	Permissions,
	SessionAuditMode,
	SessionMode,
	SessionScope,
	SkillMeta
} from '../types'
import type { SessionRuntimeConfig } from './config/shared'
import type { Caps, Descriptor, HookMap } from './core/types'

const kernel = createKernel()

export default class Session {
	id = ''
	event = null as unknown as events.EventEmitter
	descriptor: Descriptor
	caps = {} as Caps
	hooks = {} as HookMap
	session = null as unknown as SessionRow
	model = null as unknown as ModelResult

	agents = [] as Array<Agent>
	owner_agent = null as Agent | null
	project = null as Project | null
	group = null as GroupRow | null
	group_id = ''
	folders = [] as Array<{ name: string; path: string }>
	agents_map = [] as Array<{ id: string; name: string; role: string; description: string | null }>
	active_turn_id = null as string | null
	write_lock = {
		agent_id: null,
		agent_name: null,
		acquired_at: null,
		reason: null
	} as GroupWriteLock
	barrier = null as GroupBarrierState | null
	reply_queue = [] as Array<GroupReplyQueueItem>
	model_messages = [] as Array<Message>
	context = {} as Context
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
	manual_abort = false
	update_at = Date.now()
	archived_at = null as null | number
	running_since = null as Date | null
	superego_append_count = 0
	mode = 'normal' as SessionMode
	audit_mode = 'auto' as SessionAuditMode
	plan_stage = 'plan' as 'plan' | 'exec'
	disable_map = [] as SessionRuntimeConfig['disable_map']
	enable_sub_agent = true
	sub_agent_keys = [] as SessionRuntimeConfig['sub_agent_keys']
	enable_agent_tool = true
	agent_ids = [] as SessionRuntimeConfig['agent_ids']

	constructor(descriptor: Descriptor) {
		this.descriptor = descriptor
		this.group_id = descriptor.groupId || ''
	}

	get scope(): SessionScope {
		return this.caps.env.scope(this)
	}

	get cwd() {
		return this.caps.env.cwd(this)
	}

	get additional_mounts() {
		return this.caps.env.mounts(this)
	}

	get path_mappings() {
		const path_mappings = {} as Record<string, string>

		if (this.skills_dir) {
			path_mappings['/skills'] = this.skills_dir
		}

		for (const mount of this.additional_mounts) {
			path_mappings[mount.mountPoint] = mount.path
		}

		return path_mappings
	}

	get session_dir() {
		return path.resolve(`${app.app_path}/sessions/${this.id}`)
	}

	get base_context_dir() {
		return path.resolve(`${this.session_dir}/context.json`)
	}

	get base_state_dir() {
		return path.resolve(`${this.session_dir}/state.json`)
	}

	get base_context_history_dir() {
		return path.resolve(`${this.session_dir}/context_history`)
	}

	get context_dir() {
		return this.caps.env.contextDir(this)
	}

	get state_dir() {
		return this.caps.env.stateDir(this)
	}

	get context_history_dir() {
		return this.caps.env.contextHistoryDir(this)
	}

	get files_dir() {
		return path.resolve(`${this.session_dir}/files`)
	}

	get config_dir() {
		return path.resolve(`${this.session_dir}/config.json`)
	}

	get skills_dir() {
		if (this.project?.dir) return ''

		return path.resolve(app.app_path, 'skills')
	}

	get tools_dir() {
		return path.resolve(app.app_path, 'tools')
	}

	get has_todo_session_link() {
		return this.caps.env.hasTodoLink(this)
	}

	getContextPrompt = () => getContextPrompt(this.context)
	updateTitle = (focus: string) => updateTitle(this, focus)

	init = (args: InitArgs & { group_id?: string }) => kernel.init(this, args)
	getData = () => kernel.getData(this)
	getSyncData = () =>
		this.caps.sync
			.getData(this)
			.then(data => runHooks(this, 'onSync', { data }))
			.then(state => state.data)

	initSession = (is_cron?: boolean, title?: string) => initSession(this, is_cron, title)
	getSession = () => getSession(this)
	updateSession = (args: Partial<SessionInsert>) => updateSession(this, args)

	getModel = () => getModel(this)
	getProject = () => getProject(this)
	getAgentsBase = () => getAgentsBase(this)
	getOwnerAgentBase = () => getOwnerAgentBase(this)
	getAgents = () => this.caps.rel.getAgents(this)
	getOwnerAgent = () => this.caps.rel.getOwnerAgent(this)
	getFolders = () => this.caps.rel.getFolders?.(this) || Promise.resolve(this.folders)

	getMessages = () => getMessages(this)
	loadMessages = (type: 'prev' | 'next') => loadMessages(this, type)
	trimMessages = () => trimMessages(this)
	clearMessages = () => clearMessages(this)
	archiveMessages = () => archiveMessages(this)
	unarchiveMessages = () => unarchiveMessages(this)
	getMessagesCount = () => getMessagesCount(this)
	removeMessage = (message_id: string) => removeMessage(this, message_id)

	insertMessage = (v: Message) => insertMessage(this, v)
	appendMessage = (v: Message) => appendMessage(this, v)

	getTasks = () => this.caps.store.getTasks(this)
	setTasks = (v: Context['tasks'], args?: Record<string, unknown>) => this.caps.store.setTasks(this, v, args)
	clearTasks = () => this.caps.store.clearTasks(this)
	clearPlan = () => clearPlan(this)

	getContext = () => this.caps.store.getContext(this)
	getConfig = () => getConfig(this)
	setConfig = (patch: Parameters<typeof setConfig>[1]) => setConfig(this, patch)
	setContext = (v: Partial<Context>, args?: Record<string, unknown>) => this.caps.store.setContext(this, v, args)
	getState = () => this.caps.store.getState(this)
	setState = () => this.caps.store.setState(this)
	updateConfig = (config?: Awaited<ReturnType<typeof getConfig>>) => kernel.updateConfig(this, config)

	loadSkillMap = () => loadSkillMap(this)
	loadCustomToolsMap = () => loadCustomToolsMap(this)
	loadMcps = () => loadMcpTools(this)

	getStream = (message: Message) => kernel.send(this, message)
	abortStream = () => abortStream(this)

	active = () => active(this)
	setRunning = (v: boolean) => setRunning(this, v)
	sync = () => this.getSyncData().then(data => kernel.sync(this, data))
	stop = () => kernel.stop(this)
	resetAbort = () => kernel.resetAbort(this)
}
