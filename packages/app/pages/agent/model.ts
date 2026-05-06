import { arrayMove } from '@dnd-kit/sortable'
import { makeAutoObservable } from 'mobx'
import { setStorageWhenChange } from 'stk/mobx'
import { injectable } from 'tsyringe'

import { local_models } from '@/appdata'
import { Util } from '@/models/common'
import { rpc } from '@/utils'

import type { RPCInput } from '@/types'
import type { DefaultModel } from '@core/types'
import type {
	AgentAvatarConfig,
	AgentItem,
	AgentSessionItem,
	AgentTab,
	AvatarMode,
	IEditableFieldArgs,
	IUpdateAgentArgs
} from './types'

@injectable()
export default class Index {
	agents = [] as Array<AgentItem>
	selected_agent_id = ''
	current_tab = 'sessions' as AgentTab
	edit_field_key = '' as '' | 'name' | 'description' | AgentTab
	session_items = [] as Array<AgentSessionItem>
	selected_session_id = ''
	session_page = 1
	session_has_more = false
	session_request_key = 0
	avatar_dialog_open = false
	avatar_mode = 'upload' as AvatarMode
	avatar_preview_url = ''
	avatar_file_name = ''
	pending_photo = null as Uint8Array | null
	pending_avatar = null as AgentAvatarConfig | null

	get selected_agent() {
		return this.agents.find(item => item.id === this.selected_agent_id) || null
	}

	constructor(public util: Util) {
		makeAutoObservable(this, { util: false }, { autoBind: true })
	}

	async init() {
		const deinit = setStorageWhenChange(
			[{ agent_selected_agent_id: 'selected_agent_id' }, { agent_current_tab: 'current_tab' }],
			this
		)

		this.util.acts = [
			deinit,
			() => {
				if (this.avatar_preview_url) {
					URL.revokeObjectURL(this.avatar_preview_url)
				}
			}
		]

		await this.refresh()
	}

	async refresh() {
		const agent_items = await rpc.agent.query.query()

		this.agents = agent_items as Array<AgentItem>

		if (!this.agents.length) {
			this.selected_agent_id = ''
			this.session_items = []
			this.selected_session_id = ''
			this.session_page = 1
			this.session_has_more = false

			return
		}

		const has_selected_agent = this.agents.some(item => item.id === this.selected_agent_id)

		if (!has_selected_agent) {
			this.selected_agent_id = this.agents[0].id
		}

		await this.refreshSessions()
	}

	async refreshSessions() {
		if (!this.selected_agent_id) {
			this.session_items = []
			this.selected_session_id = ''
			this.session_page = 1
			this.session_has_more = false

			return
		}

		const agent_id = this.selected_agent_id
		const request_key = this.session_request_key + 1

		this.session_request_key = request_key

		const response = await rpc.agent.getSessions.query({ agent_id, page: 1 })

		if (this.session_request_key !== request_key || this.selected_agent_id !== agent_id) {
			return
		}

		this.session_items = response.sessions as Array<AgentSessionItem>
		this.session_page = 1
		this.session_has_more = response.has_more

		const has_selected_session = this.session_items.some(item => item.id === this.selected_session_id)

		if (!has_selected_session) {
			this.selected_session_id = this.session_items[0]?.id || ''
		}
	}

	async loadMoreSessions() {
		if (!this.selected_agent_id) return
		if (!this.session_has_more) return

		const agent_id = this.selected_agent_id
		const next_page = this.session_page + 1
		const response = await rpc.agent.getSessions.query({ agent_id, page: next_page })

		if (this.selected_agent_id !== agent_id) {
			return
		}

		this.session_items = [...this.session_items, ...(response.sessions as Array<AgentSessionItem>)]
		this.session_page = next_page
		this.session_has_more = response.has_more
	}

	setSelectedAgent(agent_id: string) {
		if (this.selected_agent_id === agent_id) {
			return
		}

		this.selected_agent_id = agent_id
		this.edit_field_key = ''
		void this.refreshSessions()
	}

	setCurrentTab(tab: AgentTab) {
		this.current_tab = tab
		this.edit_field_key = ''
	}

	startEditField(key: '' | 'name' | 'description' | AgentTab) {
		this.edit_field_key = key
	}

	cancelEditField() {
		this.edit_field_key = ''
	}

	setSelectedSession(session_id: string) {
		this.selected_session_id = session_id
	}

	async createAgent() {
		const default_model: DefaultModel = {
			provider: 'local model',
			model: local_models.gen.model
		}

		const next_agent = await rpc.agent.create.mutate({
			name: `Agent ${this.agents.length + 1}`,
			description: '',
			prompt: '',
			soul: '',
			identity: '',
			memory: '',
			model: default_model
		})

		await this.refresh()

		if (next_agent?.id) {
			this.selected_agent_id = next_agent.id
			await this.refreshSessions()
		}
	}

	async removeAgent(agent_id: string) {
		if (!agent_id) return

		if (this.selected_agent_id === agent_id) {
			this.selected_agent_id = ''
			this.selected_session_id = ''
		}

		await rpc.agent.remove.mutate({ id: agent_id })

		await this.refresh()
	}

	async sortAgent(from: number, to: number) {
		if (from === to) return
		if (to < 0 || to > this.agents.length - 1) return

		this.agents = arrayMove(this.agents, from, to)

		await rpc.agent.sort.mutate({ from, to })
		await this.refresh()
	}

	patchAgent(agent_id: string, updater: (agent_item: AgentItem) => AgentItem) {
		this.agents = this.agents.map(item => {
			if (item.id !== agent_id) {
				return item
			}

			return updater(item)
		})
	}

	async updateAgent(args: IUpdateAgentArgs) {
		const { id, ...rest } = args

		await rpc.agent.update.mutate({ id, ...rest } as RPCInput['agent']['update'])

		this.patchAgent(id, item => ({ ...item, ...rest }))
	}

	async submitEditableField(args: IEditableFieldArgs) {
		const { id, key, value } = args
		const next_value = value.trim()

		await this.updateAgent({ id, [key]: next_value })
		this.edit_field_key = ''
	}

	async setModel(model: DefaultModel) {
		if (!this.selected_agent_id) return

		await this.updateAgent({ id: this.selected_agent_id, model })
	}

	openAvatarDialog() {
		const agent_item = this.selected_agent

		if (!agent_item) return

		this.avatar_dialog_open = true
		this.avatar_mode = agent_item.photo
			? 'upload'
			: ((agent_item.avatar as AgentAvatarConfig | null)?.type ?? 'upload')
		this.pending_photo = agent_item.photo ? new Uint8Array(agent_item.photo as Uint8Array) : null
		this.pending_avatar = (agent_item.avatar as AgentAvatarConfig | null) || null
		this.avatar_file_name = agent_item.photo ? 'current photo' : ''

		this.resetAvatarPreview()

		if (agent_item.photo) {
			const blob = new Blob([agent_item.photo as Uint8Array])
			this.avatar_preview_url = URL.createObjectURL(blob)
		}
	}

	closeAvatarDialog() {
		this.avatar_dialog_open = false
		this.pending_photo = null
		this.pending_avatar = null
		this.avatar_file_name = ''
		this.resetAvatarPreview()
	}

	setAvatarMode(mode: AvatarMode) {
		this.avatar_mode = mode
	}

	resetAvatarPreview() {
		if (this.avatar_preview_url) {
			URL.revokeObjectURL(this.avatar_preview_url)
		}

		this.avatar_preview_url = ''
	}

	setPendingPhoto(args: { photo: Uint8Array; file_name: string; preview_url: string }) {
		const { photo, file_name, preview_url } = args

		this.pending_photo = photo
		this.avatar_file_name = file_name

		this.resetAvatarPreview()
		this.avatar_preview_url = preview_url
		this.avatar_mode = 'upload'
	}

	setPendingAvatar(avatar: AgentAvatarConfig) {
		this.pending_avatar = avatar
		this.avatar_file_name = ''
		this.resetAvatarPreview()
		this.avatar_mode = avatar.type
	}

	async submitAvatar() {
		if (!this.selected_agent_id) return

		if (this.avatar_mode === 'upload') {
			await this.updateAgent({
				id: this.selected_agent_id,
				photo: this.pending_photo,
				avatar: this.pending_avatar
			})
		} else {
			await this.updateAgent({
				id: this.selected_agent_id,
				photo: null,
				avatar: this.pending_avatar
			})
		}

		this.closeAvatarDialog()
	}

	async clearAvatarPhoto() {
		this.pending_photo = null
		this.avatar_file_name = ''
		this.resetAvatarPreview()
	}

	async createSession() {
		if (!this.selected_agent_id) return

		const next_session = await rpc.agent.createSession.mutate({ agent_id: this.selected_agent_id })

		await this.refreshSessions()

		if (next_session?.id) {
			this.selected_session_id = next_session.id
		}
	}

	deinit() {
		this.util.deinit()
	}
}
