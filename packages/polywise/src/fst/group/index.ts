import path from 'path'
import { app } from '@core/consts'
import { group, group_session } from '@core/db/schema'
import { getGroup, getSessionGroup } from '@core/db/services'
import { eq } from 'drizzle-orm'
import fs from 'fs-extra'

import Session from '../session'
import getContext from './context/getContext'
import setContext from './context/setContext'
import getAgents from './related/getAgents'
import getData from './related/getData'
import getState from './state/getState'
import setState from './state/setState'
import getStream from './stream/getStream'
import clearTasks from './task/clearTasks'
import getTasks from './task/getTasks'
import setTasks from './task/setTasks'

import type { Group as GroupRow } from '@core/db'
import type { InitArgs } from '../types'
import type {
	GroupAgentSummary,
	GroupBarrierState,
	GroupContext,
	GroupInitArgs,
	GroupReplyQueueItem,
	GroupWriteLock
} from './types'

const slugifyMount = (value: string) =>
	value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 24) || 'folder'

export default class Group extends Session {
	group_id = ''
	group = null as unknown as GroupRow
	folders = [] as Array<{ name: string; path: string }>
	active_turn_id = null as string | null
	write_lock = {
		agent_id: null,
		agent_name: null,
		acquired_at: null,
		reason: null
	} as GroupWriteLock
	barrier = null as GroupBarrierState | null
	agents_map = [] as Array<GroupAgentSummary>
	reply_queue = [] as Array<GroupReplyQueueItem>
	context = {} as GroupContext

	override get scope() {
		return { type: 'group' as const, id: this.group_id }
	}

	override get cwd() {
		return this.folders[0]?.path || super.cwd
	}

	override get additional_mounts() {
		if (!this.folders.length) {
			return []
		}

		const used = new Set<string>()

		return this.folders.slice(1).map((folder, index) => {
			const base = slugifyMount(folder.name || path.basename(folder.path) || `folder-${index + 2}`)
			let mount_point = `/folders/${base}`
			let suffix = 2

			while (used.has(mount_point)) {
				mount_point = `/folders/${base}-${suffix}`
				suffix += 1
			}

			used.add(mount_point)

			return {
				mountPoint: mount_point,
				path: folder.path
			}
		})
	}

	get group_dir() {
		return path.resolve(`${app.app_path}/groups/${this.group_id}`)
	}

	override get context_dir() {
		return path.resolve(`${this.group_dir}/context.json`)
	}

	override get state_dir() {
		return path.resolve(`${this.group_dir}/state.json`)
	}

	override get context_history_dir() {
		return path.resolve(`${this.group_dir}/context_history`)
	}

	override get has_todo_session_link() {
		return Promise.resolve(false)
	}

	getMessageSenderAgent(message: (typeof this.ui_messages)[number]) {
		if (message.role !== 'assistant') {
			return null
		}

		const sender_id = message.metadata?.sender_id

		if (sender_id) {
			return this.agents.find(agent => agent.id === sender_id) ?? null
		}

		const sender_name = message.metadata?.sender

		if (sender_name) {
			return this.agents.find(agent => agent.name === sender_name) ?? null
		}

		return null
	}

	hydrateGroupMessage(message: (typeof this.ui_messages)[number]) {
		if (message.role !== 'assistant') {
			return message
		}

		const sender_agent = this.getMessageSenderAgent(message)

		if (!sender_agent) {
			return message
		}

		const next_metadata = {
			...message.metadata,
			sender: sender_agent.name,
			sender_id: message.metadata?.sender_id ?? sender_agent.id,
			sender_role: sender_agent.role
		}

		if (
			message.metadata?.sender === next_metadata.sender &&
			message.metadata?.sender_id === next_metadata.sender_id &&
			message.metadata?.sender_role === next_metadata.sender_role
		) {
			return message
		}

		return {
			...message,
			metadata: next_metadata
		}
	}

	getHydratedUiMessages() {
		return this.ui_messages.map(message => this.hydrateGroupMessage(message))
	}

	getGroupPayload() {
		return {
			id: this.group.id,
			name: this.group.name,
			description: this.group.description ?? null,
			agents: this.agents.map(agent => ({
				id: agent.id,
				name: agent.name,
				role: agent.role,
				photo: agent.photo ?? null,
				avatar: agent.avatar ?? null
			}))
		}
	}

	getSyncData() {
		return {
			session: this.session,
			messages: this.getHydratedUiMessages(),
			context: this.context,
			archived_at: this.archived_at,
			has_older: this.ui_has_older,
			has_newer: this.ui_has_newer,
			permission: this.permission,
			mode: this.mode,
			audit_mode: this.audit_mode,
			runtime_config: {
				disable_map: this.disable_map,
				mode: this.mode,
				audit_mode: this.audit_mode,
				enable_sub_agent: this.enable_sub_agent,
				enable_agent_tool: this.enable_agent_tool,
				agent_ids: this.agent_ids
			},
			group: this.getGroupPayload()
		}
	}

	async init(args: InitArgs & GroupInitArgs) {
		const { id, event, is_cron, title, group_id } = args

		this.id = id
		this.event = event

		if (group_id) {
			this.group_id = group_id
		} else {
			const relation = await getSessionGroup(eq(group_session.session_id, id))

			if (!relation) {
				throw new Error(`Group session relation not found for session ${id}`)
			}

			this.group_id = relation.group.id
		}

		const target_group = await getGroup(eq(group.id, this.group_id))

		if (!target_group) {
			throw new Error(`Group ${this.group_id} not found`)
		}

		this.group = target_group
		await this.getFolders()

		await fs.ensureDir(this.group_dir)
		await fs.ensureDir(this.context_history_dir)
		await fs.ensureDir(this.session_dir)
		await fs.ensureDir(this.files_dir)

		await this.initSession(is_cron, title || target_group.name)
		await this.getAgents()
		await this.loadSkillMap()
		await this.loadCustomToolsMap()

		return this.getData()
	}

	override getData = () => getData(this)
	override getAgents = () => getAgents(this)
	getFolders = async () => {
		const next_group = await getGroup(eq(group.id, this.group_id))

		if (next_group) {
			this.group = next_group
		}

		this.folders = this.group?.folders ?? []

		return this.folders
	}
	override getOwnerAgent = async () => {
		this.owner_agent = null
	}

	override getContext = () => getContext(this)
	override setContext = (
		v: Partial<GroupContext>,
		args?: { agent_id?: string; agent_name?: string; turn_id?: string | null }
	) => setContext(this, v, args)
	override getTasks = () => getTasks(this)
	override setTasks = (v: GroupContext['tasks'], args?: { agent_id?: string; agent_name?: string }) =>
		setTasks(this, v, args)
	override clearTasks = () => clearTasks(this)

	override getState = () => getState(this)
	override setState = () => setState(this)

	override getStream = (message: Parameters<typeof getStream>[1]) => getStream(this, message)

	override sync = () => {
		this.event.emit(`${this.id}/change`, {
			type: 'sync',
			data: this.getSyncData()
		})
	}
}
