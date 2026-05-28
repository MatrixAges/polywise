import type { ChatEventRes, Context, InitArgs, Message, SessionScope } from '../../types'
import type { SessionRuntimeConfig } from '../config/shared'
import type Session from '../index'

export type Tag = 'group' | 'owner-agent' | 'linkcase' | 'post' | 'blocked'

export interface Descriptor {
	id: string
	scope: SessionScope
	projectId: string | null
	agentId: string | null
	groupId: string | null
	tags: Array<Tag>
}

export interface EnvCap {
	scope: (s: Session) => SessionScope
	cwd: (s: Session) => string
	mounts: (s: Session) => Array<{ mountPoint: string; path: string }>
	contextDir: (s: Session) => string
	stateDir: (s: Session) => string
	contextHistoryDir: (s: Session) => string
	hasTodoLink: (s: Session) => Promise<boolean>
}

export interface StoreCap {
	getContext: (s: Session) => Promise<void>
	setContext: (s: Session, v: Partial<Context>, args?: Record<string, unknown>) => Promise<Context | undefined>
	getTasks: (s: Session) => Promise<void>
	setTasks: (s: Session, v: Context['tasks'], args?: Record<string, unknown>) => Promise<void>
	clearTasks: (s: Session) => Promise<void>
	getState: (s: Session) => Promise<void>
	setState: (s: Session) => Promise<void>
}

export interface RelCap {
	getAgents: (s: Session) => Promise<void>
	getOwnerAgent: (s: Session) => Promise<void>
	getFolders?: (s: Session) => Promise<Array<{ name: string; path: string }>>
}

export interface SyncCap {
	getData: (s: Session) => Promise<ChatEventRes['data']>
}

export type ExecCap = (s: Session, message: Message) => Promise<ReadableStream>

export type HookName =
	| 'onInit'
	| 'onConfig'
	| 'onAccept'
	| 'onPrompt'
	| 'onTools'
	| 'onStart'
	| 'onMemberTools'
	| 'onMemberPrompt'
	| 'onMemberChunk'
	| 'onMemberDone'
	| 'onMemberError'
	| 'onChunk'
	| 'onDone'
	| 'onStop'
	| 'onError'
	| 'onSync'

export type Hook<T = Record<string, unknown>> = (s: Session, data: T) => Promise<T | void> | T | void

export type HookMap = Partial<Record<HookName, Array<Hook<any>>>>

export interface Caps {
	env: EnvCap
	store: StoreCap
	rel: RelCap
	sync: SyncCap
	exec: ExecCap
}

export interface PluginSetup {
	name: string
	order?: number
	hooks?: HookMap
	env?: EnvCap
	store?: StoreCap
	rel?: RelCap
	sync?: SyncCap
	exec?: ExecCap
}

export interface Plugin {
	name: string
	order?: number
	match: (d: Descriptor) => boolean
	setup: (s: Session) => Promise<PluginSetup> | PluginSetup
}

export interface ToolState {
	message: Message
	isFirst: boolean
	hasTodo: boolean
	reportEnabled: boolean
	extra: Record<string, unknown>
	runtime: any
	hasReportTool: boolean
	hasTitleTool: boolean
	linkedPost: any
}

export interface PromptState {
	message: Message
	isFirst: boolean
	tools: ToolState
	parts: Array<string>
	system: string
	titleFocus: string
}

export interface InitState {
	args: InitArgs & { group_id?: string }
	phase: 'before' | 'after'
}

export interface SyncState {
	data: ChatEventRes['data']
}

export interface ErrorState {
	error: unknown
	manual: boolean
}

export interface DoneState {
	message: Message
	mode: 'default' | 'group'
	responseMessage?: Message
	titleFocus?: string
	wasRunning?: boolean
}

export type Runtime = Session
