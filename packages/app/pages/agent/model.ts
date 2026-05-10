import { arrayMove } from '@dnd-kit/sortable'
import { makeAutoObservable } from 'mobx'
import { setStorageWhenChange } from 'stk/mobx'
import { injectable } from 'tsyringe'

import { local_models } from '@/appdata'
import { Setting } from '@/models'
import { Util } from '@/models/common'
import { rpc } from '@/utils'

import type { RPCInput } from '@/types'
import type { DefaultModel } from '@core/types'
import type {
	AgentArticleItem,
	AgentAvatarConfig,
	AgentItem,
	AgentPageMode,
	AgentSessionItem,
	AgentSkillItem,
	AgentTab,
	ArticleForType,
	AvatarMode,
	IEditableFieldArgs,
	ISkillOption,
	IUpdateAgentArgs
} from './types'

@injectable()
export default class Index {
	agents = [] as Array<AgentItem>
	skill_items = [] as Array<AgentSkillItem>
	skill_options = [] as Array<ISkillOption>
	selected_agent_id = ''
	page_mode = 'sessions' as AgentPageMode
	current_tab = 'prompt' as AgentTab
	edit_field_key = '' as '' | 'name' | 'description' | AgentTab
	article_items = [] as Array<AgentArticleItem>
	article_for = 'memory' as ArticleForType
	selected_article_id = ''
	article_title_draft = ''
	article_draft = ''
	article_saving = false
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

	get selected_skill_ids() {
		return this.skill_items.map(item => item.id)
	}

	get selected_article() {
		return this.article_items.find(item => item.id === this.selected_article_id) || null
	}

	constructor(
		public util: Util,
		public setting: Setting
	) {
		makeAutoObservable(this, { util: false, setting: false }, { autoBind: true })
	}

	get default_model(): DefaultModel {
		const model = this.setting.config?.default_model

		if (model?.provider && model?.model) {
			return model
		}

		return {
			provider: 'local model',
			model: local_models.gen.model
		}
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

		if ((this.current_tab as AgentTab | 'article') === 'article') {
			this.current_tab = 'content'
		}

		if (this.current_tab === 'sessions') {
			this.current_tab = 'prompt'
		}

		await this.refresh()
	}

	async refresh() {
		const agent_items = await rpc.agent.query.query()
		const skill_items = await rpc.skill.query.query()

		this.agents = agent_items as Array<AgentItem>
		this.skill_options = (skill_items as Array<AgentSkillItem>).map(item => ({
			value: item.id,
			label: item.name,
			description: item.desc,
			path: item.path
		}))

		if (!this.agents.length) {
			this.selected_agent_id = ''
			this.skill_items = []
			this.article_items = []
			this.selected_article_id = ''
			this.article_title_draft = ''
			this.article_draft = ''
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

		await this.refreshAgentRelated()
		await this.refreshSessions()
	}

	async refreshAgentRelated() {
		if (!this.selected_agent_id) {
			this.skill_items = []
			this.article_items = []
			this.selected_article_id = ''
			this.article_title_draft = ''
			this.article_draft = ''

			return
		}

		const [skill_items, article_items] = await Promise.all([
			rpc.agent.getSkills.query({ agent_id: this.selected_agent_id }),
			rpc.agent.getArticles.query({
				agent_id: this.selected_agent_id,
				for_type: this.article_for
			})
		])

		this.skill_items = skill_items as Array<AgentSkillItem>
		this.article_items = article_items as Array<AgentArticleItem>

		const has_selected_article = this.article_items.some(item => item.id === this.selected_article_id)

		if (!has_selected_article) {
			this.selected_article_id = this.article_items[0]?.id || ''
		}

		this.article_title_draft = this.selected_article?.title || ''
		this.article_draft = this.selected_article?.content || ''
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
		this.openAgentSessions(agent_id)
	}

	openAgentSessions(agent_id: string) {
		this.selectAgent(agent_id, 'sessions')
	}

	openAgentDetail(agent_id: string) {
		this.selectAgent(agent_id, 'detail')
	}

	selectAgent(agent_id: string, page_mode: AgentPageMode) {
		const same_agent = this.selected_agent_id === agent_id
		const same_mode = this.page_mode === page_mode

		if (same_agent && same_mode) {
			return
		}

		this.selected_agent_id = agent_id
		this.page_mode = page_mode
		this.edit_field_key = ''

		if (this.current_tab === 'sessions') {
			this.current_tab = 'prompt'
		}

		if (!same_agent) {
			void this.refreshAgentRelated()
			void this.refreshSessions()
		}
	}

	setCurrentTab(tab: AgentTab) {
		if (tab === 'sessions') {
			this.page_mode = 'sessions'
			tab = 'prompt'
		}

		this.current_tab = tab
		this.edit_field_key = ''
	}

	setPageMode(mode: AgentPageMode) {
		this.page_mode = mode
		this.edit_field_key = ''

		if (mode === 'detail' && this.current_tab === 'sessions') {
			this.current_tab = 'prompt'
		}
	}

	setArticleFor(for_type: ArticleForType) {
		if (this.article_for === for_type) {
			return
		}

		this.article_for = for_type
		this.selected_article_id = ''
		this.article_title_draft = ''
		this.article_draft = ''

		void this.refreshAgentRelated()
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

	setSelectedArticle(article_id: string) {
		this.selected_article_id = article_id
		this.article_title_draft = this.article_items.find(item => item.id === article_id)?.title || ''
		this.article_draft = this.article_items.find(item => item.id === article_id)?.content || ''
	}

	setArticleTitleDraft(value: string) {
		this.article_title_draft = value
	}

	setArticleDraft(value: string) {
		this.article_draft = value
	}

	async createAgent() {
		const next_agent = await rpc.agent.create.mutate({
			name: `Agent ${this.agents.length + 1}`,
			description: '',
			prompt: '',
			soul: '',
			identity: '',
			memory: '',
			model: this.default_model
		})

		await this.refresh()

		if (next_agent?.id) {
			this.selected_agent_id = next_agent.id
			this.page_mode = 'detail'
			this.current_tab = 'prompt'
			await this.refreshAgentRelated()
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
		const prev_agent = this.agents.find(item => item.id === id) || null

		if (prev_agent) {
			this.patchAgent(id, item => ({ ...item, ...rest }))
		}

		try {
			await rpc.agent.update.mutate({ id, ...rest } as RPCInput['agent']['update'])
		} catch (error) {
			if (prev_agent) {
				this.patchAgent(id, () => prev_agent)
			}

			throw error
		}
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

	async setModelEffort(effort: string) {
		if (!this.selected_agent_id) return

		const agent_item = this.selected_agent

		if (!agent_item) return

		await this.updateAgent({
			id: this.selected_agent_id,
			model: {
				...agent_item.model,
				effort
			}
		})
	}

	async setSkills(skill_ids: Array<string>) {
		if (!this.selected_agent_id) return

		await rpc.agent.setSkills.mutate({
			agent_id: this.selected_agent_id,
			skill_ids
		})

		const next_skill_items = await rpc.agent.getSkills.query({ agent_id: this.selected_agent_id })

		this.skill_items = next_skill_items as Array<AgentSkillItem>
	}

	async createArticle() {
		if (!this.selected_agent_id) return

		const article_id = await rpc.agent.createArticle.mutate({
			agent_id: this.selected_agent_id,
			for: this.article_for,
			title: 'New article',
			content: ''
		})

		await this.refreshAgentRelated()

		if (article_id) {
			this.selected_article_id = article_id
			this.article_title_draft =
				this.article_items.find(item => item.id === article_id)?.title || 'New article'
			this.article_draft = this.article_items.find(item => item.id === article_id)?.content || ''
		}
	}

	async saveArticle() {
		if (!this.selected_article_id) return

		this.article_saving = true

		try {
			await rpc.agent.updateArticle.mutate({
				article_id: this.selected_article_id,
				for: this.article_for,
				title: this.article_title_draft.trim() || 'New article',
				content: this.article_draft
			})

			await this.refreshAgentRelated()
		} finally {
			this.article_saving = false
		}
	}

	async removeArticle(article_id: string) {
		if (!this.selected_agent_id) return

		await rpc.agent.removeArticle.mutate({ agent_id: this.selected_agent_id, article_id })
		await this.refreshAgentRelated()
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
			const blob = new Blob([new Uint8Array(agent_item.photo as Uint8Array)])
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
