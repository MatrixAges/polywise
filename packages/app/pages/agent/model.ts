import { arrayMove } from '@dnd-kit/sortable'
import dayjs from 'dayjs'
import { makeAutoObservable } from 'mobx'
import { genConfig } from 'react-nice-avatar'
import { toast } from 'sonner'
import { setStorageWhenChange } from 'stk/mobx'
import { injectable } from 'tsyringe'

import { local_models } from '@/appdata'
import { Setting } from '@/models'
import { Files, Util } from '@/models/common'
import { rpc } from '@/utils'

import type { RPCInput } from '@/types'
import type { SessionStatusPayload } from '@core/rpc/session/watchSessionStatus'
import type { DefaultModel } from '@core/types'
import type {
	AgentArticleItem,
	AgentArticleSearchItem,
	AgentAvatarConfig,
	AgentCreateMode,
	AgentItem,
	AgentMenuScope,
	AgentPageMode,
	AgentSessionItem,
	AgentSkillItem,
	AgentSkillLogItem,
	AgentSkillLogResponse,
	AgentTab,
	AgentToolItem,
	AgentToolLogItem,
	AgentToolLogResponse,
	ArticleForType,
	AvatarMode,
	GroupItem,
	IEditableFieldArgs,
	IGroupDialogSubmitArgs,
	ISkillOption,
	IToolOption,
	IUpdateAgentArgs
} from './types'

const getFolderName = (folder_path: string) => {
	const normalized = folder_path.replace(/\/+$/g, '')
	const segments = normalized.split('/').filter(Boolean)

	return segments.at(-1) || normalized || '/'
}

@injectable()
export default class Index {
	agents = [] as Array<AgentItem>
	skill_items = [] as Array<AgentSkillItem>
	skill_options = [] as Array<ISkillOption>
	tool_options = [] as Array<IToolOption>
	tool_log_items = [] as Array<AgentToolLogItem>
	tool_log_date = dayjs().format('YYYY-MM-DD')
	tool_log_page = 1
	tool_log_total = 0
	tool_log_has_more = false
	tool_log_loading = false
	tool_log_available_dates = [] as Array<string>
	tool_log_request_key = 0
	menu_scope = 'agent' as AgentMenuScope
	skill_log_items = [] as Array<AgentSkillLogItem>
	skill_log_date = dayjs().format('YYYY-MM-DD')
	skill_log_page = 1
	skill_log_total = 0
	skill_log_has_more = false
	skill_log_loading = false
	skill_log_available_dates = [] as Array<string>
	skill_log_request_key = 0
	selected_agent_id = ''
	page_mode = 'sessions' as AgentPageMode
	current_tab = 'info' as AgentTab
	edit_field_key = '' as '' | 'name' | 'role' | 'description' | AgentTab
	session_menu_open = true
	article_items = [] as Array<AgentArticleItem>
	article_for = 'memory' as ArticleForType
	article_search = ''
	article_search_list = [] as Array<AgentArticleSearchItem>
	article_search_loading = false
	article_search_request_key = ''
	article_search_timer = 0
	private_article_dialog_open = false
	private_article_dialog_loading = false
	private_article_dialog_article_id = ''
	private_article_dialog_title = ''
	private_article_dialog_content = ''
	pins = [] as Array<AgentSessionItem>
	session_items = [] as Array<AgentSessionItem>
	pin_map = {} as Record<string, number>
	selected_session_id = ''
	rename_session_id = ''
	rename_value = ''
	session_page = 1
	session_has_more = false
	session_request_key = 0
	session_loading = false
	session_loading_more = false
	session_initialized = false
	session_status_map = {} as SessionStatusPayload
	create_dialog_open = false
	import_dialog_open = false
	import_agent_file_path = ''
	import_agent_loading = false
	export_agent_loading = false
	create_agent_mode = 'auto' as AgentCreateMode
	create_agent_purpose = ''
	create_agent_name = ''
	create_agent_role = ''
	create_agent_description = ''
	create_agent_loading = false
	group_dialog_open = false
	group_dialog_tab = 'info' as 'info' | 'folders'
	editing_group_id = ''
	group_dialog_name = ''
	group_dialog_description = ''
	group_dialog_selected_agent_ids = [] as Array<string>
	group_dialog_folders = [] as Array<{ name: string; path: string }>
	group_dialog_photo = null as Uint8Array | null
	group_dialog_photo_url = ''
	group_dialog_file_name = ''
	create_group_loading = false
	update_group_loading = false
	group_side_panel_open = false
	group_content_tab = 'session' as 'session' | 'file'
	selected_group_folder_path = ''
	skill_dialog_open = false
	avatar_dialog_open = false
	avatar_mode = 'upload' as AvatarMode
	avatar_preview_url = ''
	avatar_file_name = ''
	pending_photo = null as Uint8Array | null
	pending_avatar = null as AgentAvatarConfig | null
	groups = [] as Array<GroupItem>
	selected_group_id = ''

	get selected_agent() {
		return this.agents.find(item => item.id === this.selected_agent_id) || null
	}

	get selected_group() {
		return this.groups.find(item => item.id === this.selected_group_id) || null
	}

	get editing_group() {
		return this.groups.find(item => item.id === this.editing_group_id) || null
	}

	get selected_group_session_id() {
		return this.selected_group?.session_ids?.[0] || ''
	}

	get selected_group_session_status() {
		return this.selected_group_session_id
			? (this.session_status_map[this.selected_group_session_id] ?? null)
			: null
	}

	get selected_group_folders() {
		return this.selected_group?.folders || []
	}

	get selected_skill_ids() {
		return this.skill_items.map(item => item.id)
	}

	get selected_tool_names() {
		return this.selected_agent?.tools || []
	}

	get can_manage_private_articles() {
		return this.article_for === 'wiki' || this.article_for === 'memory' || this.article_for === 'user'
	}

	get private_article_dialog_editing() {
		return Boolean(this.private_article_dialog_article_id)
	}

	constructor(
		public util: Util,
		public setting: Setting,
		public import_dialog_files: Files,
		public group_dialog_files: Files,
		public group_files: Files
	) {
		makeAutoObservable(
			this,
			{
				util: false,
				setting: false,
				import_dialog_files: false,
				group_dialog_files: false,
				group_files: false
			},
			{ autoBind: true }
		)
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
			[
				{ agent_selected_agent_id: 'selected_agent_id' },
				{ agent_selected_group_id: 'selected_group_id' },
				{ agent_menu_scope: 'menu_scope' },
				{ agent_current_tab: 'current_tab' },
				{ agent_session_menu_open: 'session_menu_open' }
			],
			this
		)

		this.util.acts = [
			deinit,
			() => {
				this.clearArticleSearchTimer()

				if (this.avatar_preview_url) {
					URL.revokeObjectURL(this.avatar_preview_url)
				}

				if (this.group_dialog_photo_url) {
					URL.revokeObjectURL(this.group_dialog_photo_url)
				}
			}
		]

		if ((this.current_tab as AgentTab | 'article') === 'article') {
			this.current_tab = 'content'
		}

		if (this.current_tab === 'sessions') {
			this.current_tab = 'info'
		}

		await this.refresh()
		await this.hydrateSessionStatusMap()
		this.watchSessionStatus()
	}

	async refresh() {
		const [agent_items, skill_items, tool_items, group_items] = await Promise.all([
			rpc.agent.query.query(),
			rpc.skill.query.query(),
			rpc.tool.query.query(),
			rpc.group.query.query({})
		])

		this.agents = agent_items as Array<AgentItem>
		this.skill_options = (skill_items as Array<AgentSkillItem>).map(item => ({
			value: item.id,
			label: item.name,
			description: item.desc,
			path: item.path
		}))
		this.tool_options = (tool_items as Array<AgentToolItem>).map(item => ({
			value: item.name,
			label: item.name,
			description: item.description
		}))
		this.groups = group_items as Array<GroupItem>

		if (!this.agents.length) {
			this.selected_agent_id = ''
			this.skill_items = []
			this.article_items = []
			this.clearArticleSearch()
			this.pins = []
			this.session_items = []
			this.pin_map = {}
			this.selected_session_id = ''
			this.rename_session_id = ''
			this.rename_value = ''
			this.session_page = 1
			this.session_has_more = false
			this.session_loading = false
			this.session_loading_more = false
			this.session_initialized = false
			this.resetToolLogs()
			this.resetSkillLogs()
		}

		const has_selected_agent = this.agents.some(item => item.id === this.selected_agent_id)
		const has_selected_group = this.groups.some(item => item.id === this.selected_group_id)

		if (this.agents.length && !has_selected_agent) {
			this.selected_agent_id = this.agents[0].id
		}

		if (this.groups.length && !has_selected_group) {
			this.selected_group_id = this.groups[0].id
		}

		if (this.selected_agent_id) {
			await Promise.all([
				this.refreshAgentRelated(),
				this.refreshSessions(),
				this.refreshToolLogs(),
				this.refreshSkillLogs()
			])
		}
	}

	async refreshGroups() {
		const group_items = await rpc.group.query.query({})

		this.groups = group_items as Array<GroupItem>

		if (!this.groups.length) {
			this.selected_group_id = ''
			this.selected_group_folder_path = ''
			this.group_content_tab = 'session'
			this.group_side_panel_open = false

			return
		}

		if (!this.groups.some(item => item.id === this.selected_group_id)) {
			this.selected_group_id = this.groups[0].id
		}

		if (this.group_side_panel_open) {
			await this.syncGroupFolderPanel()
		}
	}

	async refreshAgentRelated() {
		if (!this.selected_agent_id) {
			this.skill_items = []
			this.article_items = []
			this.clearArticleSearch()

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

		this.scheduleArticleSearch()
	}

	async refreshSessions() {
		if (!this.selected_agent_id) {
			this.pins = []
			this.session_items = []
			this.pin_map = {}
			this.selected_session_id = ''
			this.rename_session_id = ''
			this.rename_value = ''
			this.session_page = 1
			this.session_has_more = false
			this.session_initialized = false

			return
		}

		const agent_id = this.selected_agent_id
		const request_key = this.session_request_key + 1

		this.session_request_key = request_key
		this.session_loading = true

		try {
			const response = await rpc.agent.getSessions.query({ agent_id, page: 1 })

			if (this.session_request_key !== request_key || this.selected_agent_id !== agent_id) {
				return
			}

			this.pins = response.pins as Array<AgentSessionItem>
			this.session_items = response.sessions as Array<AgentSessionItem>
			this.pin_map = response.pin_map
			this.session_page = 1
			this.session_has_more = response.has_more

			const session_id_list = this.pins.map(item => item.id).concat(this.session_items.map(item => item.id))
			const has_selected_session = session_id_list.includes(this.selected_session_id)

			if (this.rename_session_id && !session_id_list.includes(this.rename_session_id)) {
				this.onCancelRename()
			}

			if (!has_selected_session) {
				this.selected_session_id = this.pins[0]?.id || this.session_items[0]?.id || ''
			}

			this.session_initialized = true
		} finally {
			if (this.session_request_key === request_key) {
				this.session_loading = false
			}
		}
	}

	resetToolLogs() {
		this.tool_log_items = []
		this.tool_log_total = 0
		this.tool_log_has_more = false
		this.tool_log_page = 1
		this.tool_log_available_dates = []
		this.tool_log_loading = false
	}

	resetSkillLogs() {
		this.skill_log_items = []
		this.skill_log_total = 0
		this.skill_log_has_more = false
		this.skill_log_page = 1
		this.skill_log_available_dates = []
		this.skill_log_loading = false
	}

	async refreshToolLogs(args?: { date?: string; page?: number }) {
		if (!this.selected_agent_id) {
			this.resetToolLogs()

			return
		}

		const agent_id = this.selected_agent_id
		const request_key = this.tool_log_request_key + 1
		const page = args?.page ?? this.tool_log_page

		this.tool_log_request_key = request_key
		this.tool_log_loading = true

		try {
			const response = (await rpc.agent.getToolLogs.query({
				agent_id,
				date: args?.date,
				page
			})) as AgentToolLogResponse

			if (this.tool_log_request_key !== request_key || this.selected_agent_id !== agent_id) {
				return
			}

			this.tool_log_items = response.items as Array<AgentToolLogItem>
			this.tool_log_total = response.total
			this.tool_log_has_more = response.has_more
			this.tool_log_page = response.page
			this.tool_log_date = response.date
			this.tool_log_available_dates = response.available_dates
		} finally {
			if (this.tool_log_request_key === request_key) {
				this.tool_log_loading = false
			}
		}
	}

	async refreshSkillLogs(args?: { date?: string; page?: number }) {
		if (!this.selected_agent_id) {
			this.resetSkillLogs()

			return
		}

		const agent_id = this.selected_agent_id
		const request_key = this.skill_log_request_key + 1
		const page = args?.page ?? this.skill_log_page

		this.skill_log_request_key = request_key
		this.skill_log_loading = true

		try {
			const response = (await rpc.agent.getSkillLogs.query({
				agent_id,
				date: args?.date,
				page
			})) as AgentSkillLogResponse

			if (this.skill_log_request_key !== request_key || this.selected_agent_id !== agent_id) {
				return
			}

			this.skill_log_items = response.items as Array<AgentSkillLogItem>
			this.skill_log_total = response.total
			this.skill_log_has_more = response.has_more
			this.skill_log_page = response.page
			this.skill_log_date = response.date
			this.skill_log_available_dates = response.available_dates
		} finally {
			if (this.skill_log_request_key === request_key) {
				this.skill_log_loading = false
			}
		}
	}

	async loadMoreSessions() {
		if (!this.selected_agent_id) return
		if (this.session_loading) return
		if (this.session_loading_more) return
		if (!this.session_has_more) return

		const agent_id = this.selected_agent_id
		const next_page = this.session_page + 1
		this.session_loading_more = true

		try {
			const response = await rpc.agent.getSessions.query({ agent_id, page: next_page })

			if (this.selected_agent_id !== agent_id) {
				return
			}

			this.session_items = [...this.session_items, ...(response.sessions as Array<AgentSessionItem>)]
			this.session_page = next_page
			this.session_has_more = response.has_more
		} finally {
			this.session_loading_more = false
		}
	}

	setSelectedAgent(agent_id: string) {
		this.openAgentSessions(agent_id)
	}

	openAgentSessions(agent_id: string) {
		this.menu_scope = 'agent'
		this.session_menu_open = true
		this.selectAgent(agent_id, 'sessions')
	}

	openAgentDetail(agent_id: string) {
		this.menu_scope = 'agent'
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
		this.closePrivateArticleDialog()

		if (this.current_tab === 'sessions') {
			this.current_tab = 'info'
		}

		if (!same_agent) {
			void this.refreshAgentRelated()
			void this.refreshSessions()
			void this.refreshToolLogs()
			void this.refreshSkillLogs()
		}
	}

	setCurrentTab(tab: AgentTab) {
		if (tab === 'sessions') {
			this.page_mode = 'sessions'
			tab = 'info'
		}

		this.current_tab = tab
		this.edit_field_key = ''
	}

	setPageMode(mode: AgentPageMode) {
		this.menu_scope = 'agent'
		this.page_mode = mode
		this.edit_field_key = ''

		if (mode === 'detail' && this.current_tab === 'sessions') {
			this.current_tab = 'info'
		}
	}

	setSessionMenuOpen(open: boolean) {
		this.session_menu_open = open
	}

	setCreateDialogOpen(open: boolean) {
		this.create_dialog_open = open

		if (!open) {
			this.create_agent_mode = 'auto'
			this.create_agent_purpose = ''
			this.create_agent_name = ''
			this.create_agent_role = ''
			this.create_agent_description = ''
		}
	}

	openCreateAgentDialog() {
		this.create_agent_mode = 'auto'
		this.create_agent_purpose = ''
		this.create_agent_name = ''
		this.create_agent_role = ''
		this.create_agent_description = ''
		this.create_dialog_open = true
	}

	closeCreateAgentDialog() {
		this.setCreateDialogOpen(false)
	}

	setImportDialogOpen(open: boolean, options?: { force?: boolean }) {
		if (this.import_agent_loading && !options?.force) {
			return
		}

		this.import_dialog_open = open

		if (!open) {
			this.import_agent_file_path = ''
			this.import_dialog_files.reset()
		}
	}

	async initImportDialogFiles(root_path?: string) {
		const configured_root = this.setting.config?.agent_export_dir?.trim()
		const home_dir = await rpc.file.homedir.query()
		const candidates = Array.from(
			new Set([root_path, configured_root, home_dir].map(item => item?.trim()).filter(Boolean))
		) as Array<string>

		let last_error: unknown = null

		for (const candidate of candidates) {
			try {
				await this.import_dialog_files.init(candidate, {
					dir_only: false,
					show_hidden: false,
					file_extensions: ['papk']
				})

				return
			} catch (error) {
				last_error = error
			}
		}

		if (last_error) {
			throw last_error
		}
	}

	async openImportDialog() {
		this.import_agent_file_path = ''
		this.import_dialog_open = true

		try {
			await this.initImportDialogFiles()
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to open import files.')
		}
	}

	closeImportDialog(options?: { force?: boolean }) {
		this.setImportDialogOpen(false, options)
	}

	setImportAgentFilePath(file_path: string) {
		this.import_agent_file_path = file_path
	}

	async selectImportDialogPath(args: { directory: boolean; path: string }) {
		if (args.directory) {
			await this.import_dialog_files.selectPath(args)

			return
		}

		const target_path = this.import_dialog_files.getAbsolutePath(args.path)

		if (!target_path.toLowerCase().endsWith('.papk')) {
			toast.error('Select a .papk file.')

			return
		}

		this.import_agent_file_path = target_path
	}

	async submitImportAgent() {
		const file_path = this.import_agent_file_path.trim()

		if (!file_path || this.import_agent_loading) {
			return
		}

		this.import_agent_loading = true

		try {
			const result = await rpc.agent.importPack.mutate({ file_path })
			this.closeImportDialog({ force: true })

			await this.refresh()
			this.menu_scope = 'agent'
			this.selected_agent_id = result.agent_id
			this.page_mode = 'detail'
			this.current_tab = 'info'
			await Promise.all([
				this.refreshAgentRelated(),
				this.refreshSessions(),
				this.refreshToolLogs(),
				this.refreshSkillLogs()
			])
			toast.success(`Imported ${result.agent_name}.`)
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Agent import failed.')
		} finally {
			this.import_agent_loading = false
		}
	}

	setCreateAgentPurpose(value: string) {
		this.create_agent_purpose = value
	}

	setCreateAgentMode(mode: AgentCreateMode) {
		this.create_agent_mode = mode
	}

	setCreateAgentName(value: string) {
		this.create_agent_name = value
	}

	setCreateAgentRole(value: string) {
		this.create_agent_role = value
	}

	setCreateAgentDescription(value: string) {
		this.create_agent_description = value
	}

	setMenuScope(scope: AgentMenuScope) {
		this.menu_scope = scope

		if (scope === 'group') {
			if (!this.selected_group_id && this.groups[0]) {
				this.selected_group_id = this.groups[0].id
			}

			return
		}

		if (!this.selected_agent_id && this.agents[0]) {
			this.selected_agent_id = this.agents[0].id
		}
	}

	toggleSessionMenu() {
		this.session_menu_open = !this.session_menu_open
	}

	setSkillDialogOpen(open: boolean) {
		this.skill_dialog_open = open
	}

	openSkillDialog() {
		this.skill_dialog_open = true
	}

	closeSkillDialog() {
		this.skill_dialog_open = false
	}

	async exportSelectedAgent() {
		if (!this.selected_agent_id || this.export_agent_loading) {
			return
		}

		this.export_agent_loading = true

		try {
			const result = await rpc.agent.exportPack.mutate({ agent_id: this.selected_agent_id })

			toast.success(`Exported to ${result.file_path}.`)
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Agent export failed.')
		} finally {
			this.export_agent_loading = false
		}
	}

	setArticleFor(for_type: ArticleForType) {
		if (this.article_for === for_type) {
			return
		}

		this.article_for = for_type
		this.clearArticleSearch()
		this.closePrivateArticleDialog()

		void this.refreshAgentRelated()
	}

	setPrivateArticleDialogOpen(open: boolean, options?: { force?: boolean }) {
		if (this.private_article_dialog_loading && !options?.force) {
			return
		}

		this.private_article_dialog_open = open

		if (!open) {
			this.private_article_dialog_article_id = ''
			this.private_article_dialog_title = ''
			this.private_article_dialog_content = ''
		}
	}

	openCreatePrivateArticleDialog() {
		if (!this.selected_agent_id || !this.can_manage_private_articles) {
			return
		}

		this.private_article_dialog_article_id = ''
		this.private_article_dialog_title = ''
		this.private_article_dialog_content = ''
		this.private_article_dialog_open = true
	}

	openEditPrivateArticleDialog(item: AgentArticleItem) {
		if (
			!this.selected_agent_id ||
			item.scope_type !== 'agent' ||
			item.scope_id !== this.selected_agent_id ||
			!this.can_manage_private_articles
		) {
			return
		}

		this.private_article_dialog_article_id = item.id
		this.private_article_dialog_title = item.title || ''
		this.private_article_dialog_content = item.content || ''
		this.private_article_dialog_open = true
	}

	closePrivateArticleDialog(options?: { force?: boolean }) {
		this.setPrivateArticleDialogOpen(false, options)
	}

	setPrivateArticleDialogTitle(value: string) {
		this.private_article_dialog_title = value
	}

	setPrivateArticleDialogContent(value: string) {
		this.private_article_dialog_content = value
	}

	async submitPrivateArticleDialog() {
		if (!this.selected_agent_id || !this.can_manage_private_articles || this.private_article_dialog_loading) {
			return
		}

		const content = this.private_article_dialog_content.trim()

		if (!content) {
			toast.error('Content is required.')

			return
		}

		this.private_article_dialog_loading = true

		try {
			const editing = this.private_article_dialog_editing

			await rpc.agent.savePrivateArticle.mutate({
				agent_id: this.selected_agent_id,
				article_id: this.private_article_dialog_article_id || undefined,
				for_type: this.article_for as Extract<ArticleForType, 'wiki' | 'memory' | 'user'>,
				title: this.private_article_dialog_title.trim() || undefined,
				content
			})

			this.closePrivateArticleDialog({ force: true })
			await this.refreshAgentRelated()
			toast.success(editing ? 'Article updated.' : 'Article added.')
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to save article.')
		} finally {
			this.private_article_dialog_loading = false
		}
	}

	clearArticleSearchTimer() {
		if (this.article_search_timer) {
			clearTimeout(this.article_search_timer)
			this.article_search_timer = 0
		}
	}

	scheduleArticleSearch() {
		this.clearArticleSearchTimer()

		if (!this.selected_agent_id || !this.article_search.trim()) {
			this.article_search_list = []
			this.article_search_loading = false

			return
		}

		this.article_search_loading = true
		const request_key = `${this.selected_agent_id}:${this.article_for}:${this.article_search.trim()}:${Date.now()}`

		this.article_search_request_key = request_key
		this.article_search_timer = window.setTimeout(() => {
			void rpc.agent.searchArticles
				.query({
					agent_id: this.selected_agent_id,
					for_type: this.article_for,
					query: this.article_search.trim(),
					page: 1
				})
				.then(response => {
					if (this.article_search_request_key === request_key) {
						this.article_search_list = response.list as Array<AgentArticleSearchItem>
					}
				})
				.finally(() => {
					if (this.article_search_request_key === request_key) {
						this.article_search_loading = false
					}
				})
		}, 280)
	}

	setArticleSearch(value: string) {
		this.article_search = value
		this.scheduleArticleSearch()
	}

	clearArticleSearch() {
		this.clearArticleSearchTimer()
		this.article_search = ''
		this.article_search_list = []
		this.article_search_loading = false
		this.article_search_request_key = ''
	}

	startEditField(key: '' | 'name' | 'role' | 'description' | AgentTab) {
		this.edit_field_key = key
	}

	cancelEditField() {
		this.edit_field_key = ''
	}

	setSelectedSession(session_id: string) {
		this.selected_session_id = session_id
	}

	async openGroup(group_id: string) {
		this.menu_scope = 'group'
		this.selected_group_id = group_id

		const group_item = this.groups.find(item => item.id === group_id)

		if (this.group_side_panel_open) {
			void this.syncGroupFolderPanel()
		}

		if (group_item?.session_ids?.length) {
			return
		}

		const session = await rpc.group.createSession.mutate({
			group_id,
			title: group_item?.name
		})

		await this.refreshGroups()

		if (session?.id && !this.selected_group_id) {
			this.selected_group_id = group_id
		}
	}

	setGroupDialogTab(tab: 'info' | 'folders') {
		this.group_dialog_tab = tab
	}

	async initGroupDialogFiles(root_path?: string) {
		const next_root = root_path || (await rpc.file.homedir.query())

		await this.group_dialog_files.init(next_root, { dir_only: true, show_hidden: false })
	}

	addGroupDialogFolder(folder_path = this.group_dialog_files.input_path.trim()) {
		const next_path = folder_path.trim()

		if (!next_path || this.group_dialog_folders.some(item => item.path === next_path)) {
			return
		}

		this.group_dialog_folders = [
			...this.group_dialog_folders,
			{ name: getFolderName(next_path), path: next_path }
		]
	}

	removeGroupDialogFolder(folder_path: string) {
		this.group_dialog_folders = this.group_dialog_folders.filter(item => item.path !== folder_path)
	}

	closeGroupFolders() {
		this.group_side_panel_open = false
		this.group_content_tab = 'session'
	}

	async toggleGroupFolders() {
		if (this.group_side_panel_open) {
			this.closeGroupFolders()

			return
		}

		this.group_side_panel_open = true
		await this.syncGroupFolderPanel()
	}

	setGroupContentTab(tab: 'session' | 'file') {
		this.group_content_tab = tab
	}

	async setGroupFolderPath(folder_path: string) {
		const next_path = folder_path.trim()

		if (!next_path) {
			this.selected_group_folder_path = ''
			this.group_content_tab = 'session'

			return
		}

		const reuse_current_folder =
			this.group_side_panel_open &&
			this.selected_group_folder_path === next_path &&
			this.group_files.root_path === next_path

		this.selected_group_folder_path = next_path
		this.group_side_panel_open = true
		this.group_content_tab = 'session'

		if (reuse_current_folder) {
			return
		}

		await this.group_files.init(next_path, { dir_only: false, show_hidden: true })
	}

	async syncGroupFolderPanel() {
		const folders = this.selected_group_folders

		if (!folders.length) {
			this.selected_group_folder_path = ''
			this.group_content_tab = 'session'

			return
		}

		const next_folder_path = folders.some(item => item.path === this.selected_group_folder_path)
			? this.selected_group_folder_path
			: folders[0].path

		await this.setGroupFolderPath(next_folder_path)
	}

	async selectGroupFilePath(args: { directory: boolean; path: string }) {
		await this.group_files.selectPath(args)

		if (!args.directory) {
			this.group_content_tab = 'file'
		}
	}

	onRenameSession(session_id: string, title: string) {
		this.rename_session_id = session_id
		this.rename_value = title
	}

	setRenameValue(value: string) {
		this.rename_value = value
	}

	onCancelRename() {
		this.rename_session_id = ''
		this.rename_value = ''
	}

	async createAgent(args?: { purpose?: string; name?: string; role?: string; description?: string }) {
		if (this.create_agent_loading) return

		this.create_agent_loading = true

		try {
			const next_agent = await rpc.agent.create.mutate({
				purpose: args?.purpose?.trim() || undefined,
				name: args?.name?.trim() || undefined,
				role: args?.role?.trim() || undefined,
				description: args?.description?.trim() || undefined,
				avatar: {
					type: 'nice',
					data: genConfig()
				},
				prompt: '',
				soul: '',
				identity: '',
				memory: ''
			})

			await this.refresh()

			if (next_agent?.id) {
				this.selected_agent_id = next_agent.id
				this.page_mode = 'detail'
				this.current_tab = 'info'
				await Promise.all([
					this.refreshAgentRelated(),
					this.refreshSessions(),
					this.refreshToolLogs(),
					this.refreshSkillLogs()
				])
			}
		} finally {
			this.create_agent_loading = false
		}
	}

	async submitCreateAgentDialog() {
		const purpose = this.create_agent_purpose.trim()
		const name = this.create_agent_name.trim()
		const role = this.create_agent_role.trim()
		const description = this.create_agent_description.trim()

		if (this.create_agent_mode === 'auto' && !purpose) {
			return
		}

		if (this.create_agent_mode === 'input' && (!name || !role)) {
			return
		}

		await this.createAgent(
			this.create_agent_mode === 'auto'
				? { purpose }
				: {
						name,
						role,
						description
					}
		)
		this.closeCreateAgentDialog()
	}

	setGroupDialogOpen(open: boolean) {
		if (open) {
			this.group_dialog_open = true

			return
		}

		this.closeGroupDialog()
	}

	openCreateGroupDialog() {
		this.group_dialog_tab = 'info'
		this.editing_group_id = ''
		this.group_dialog_name = ''
		this.group_dialog_description = ''
		this.group_dialog_selected_agent_ids = []
		this.group_dialog_folders = []
		this.group_dialog_photo = null
		this.group_dialog_file_name = ''
		this.resetGroupDialogPhotoPreview()
		this.group_dialog_open = true
		void this.initGroupDialogFiles()
	}

	openEditGroupDialog(group_id: string) {
		const group = this.groups.find(item => item.id === group_id)

		if (!group) {
			return
		}

		this.editing_group_id = group.id
		this.group_dialog_name = group.name || ''
		this.group_dialog_description = group.description || ''
		this.group_dialog_selected_agent_ids = group.agents.map(item => item.id)
		this.group_dialog_folders = group.folders.map(item => ({ name: item.name, path: item.path }))
		this.group_dialog_photo = group.photo ? new Uint8Array(group.photo as Uint8Array) : null
		this.group_dialog_file_name = group.photo ? 'current photo' : ''
		this.group_dialog_tab = 'info'
		this.resetGroupDialogPhotoPreview()

		if (group.photo) {
			const blob = new Blob([new Uint8Array(group.photo as Uint8Array)])

			this.group_dialog_photo_url = URL.createObjectURL(blob)
		}

		this.group_dialog_open = true
		void this.initGroupDialogFiles(group.folders[0]?.path)
	}

	closeGroupDialog() {
		this.group_dialog_open = false
		this.group_dialog_tab = 'info'
		this.editing_group_id = ''
		this.group_dialog_name = ''
		this.group_dialog_description = ''
		this.group_dialog_selected_agent_ids = []
		this.group_dialog_folders = []
		this.group_dialog_photo = null
		this.group_dialog_file_name = ''
		this.resetGroupDialogPhotoPreview()
	}

	setGroupDialogName(value: string) {
		this.group_dialog_name = value
	}

	setGroupDialogDescription(value: string) {
		this.group_dialog_description = value
	}

	resetGroupDialogPhotoPreview() {
		if (this.group_dialog_photo_url) {
			URL.revokeObjectURL(this.group_dialog_photo_url)
		}

		this.group_dialog_photo_url = ''
	}

	setGroupDialogPhoto(args: { photo: Uint8Array; file_name: string; preview_url: string }) {
		const { photo, file_name, preview_url } = args

		this.group_dialog_photo = photo
		this.group_dialog_file_name = file_name
		this.resetGroupDialogPhotoPreview()
		this.group_dialog_photo_url = preview_url
	}

	clearGroupDialogPhoto() {
		this.group_dialog_photo = null
		this.group_dialog_file_name = ''
		this.resetGroupDialogPhotoPreview()
	}

	toggleGroupDialogAgent(agent_id: string) {
		if (this.group_dialog_selected_agent_ids.includes(agent_id)) {
			this.group_dialog_selected_agent_ids = this.group_dialog_selected_agent_ids.filter(
				item => item !== agent_id
			)

			return
		}

		this.group_dialog_selected_agent_ids = [...this.group_dialog_selected_agent_ids, agent_id]
	}

	async createGroup(args: IGroupDialogSubmitArgs) {
		if (this.create_group_loading) return null

		this.create_group_loading = true

		try {
			const agent_ids = [...args.agent_ids]
			const folders = args.folders.map(item => ({ name: item.name, path: item.path }))

			const res = await rpc.group.create.mutate({
				name: args.name,
				description: args.description || undefined,
				photo: args.photo,
				agent_ids,
				folders
			})

			await this.refreshGroups()
			this.menu_scope = 'group'
			this.selected_group_id = res.group.id

			return res.group
		} finally {
			this.create_group_loading = false
		}
	}

	async submitGroupDialog() {
		const name = this.group_dialog_name.trim()
		const agent_ids = [...this.group_dialog_selected_agent_ids]
		const folders = this.group_dialog_folders.map(item => ({ name: item.name, path: item.path }))

		if (!name || !agent_ids.length) {
			return null
		}

		if (this.editing_group_id) {
			await this.updateGroup({
				id: this.editing_group_id,
				name,
				description: this.group_dialog_description.trim(),
				photo: this.group_dialog_photo,
				agent_ids,
				folders
			})
		} else {
			await this.createGroup({
				name,
				description: this.group_dialog_description.trim(),
				photo: this.group_dialog_photo,
				agent_ids,
				folders
			})
		}

		this.closeGroupDialog()
	}

	async updateGroup(args: IGroupDialogSubmitArgs) {
		if (!args.id || this.update_group_loading) return null

		this.update_group_loading = true

		try {
			const agent_ids = [...args.agent_ids]
			const folders = args.folders.map(item => ({ name: item.name, path: item.path }))

			await rpc.group.update.mutate({
				id: args.id,
				name: args.name,
				description: args.description,
				photo: args.photo
			})
			await rpc.group.setAgents.mutate({
				id: args.id,
				agent_ids
			})
			await rpc.group.setFolders.mutate({
				id: args.id,
				folders
			})

			await this.refreshGroups()
			this.menu_scope = 'group'
			this.selected_group_id = args.id

			return this.groups.find(item => item.id === args.id) || null
		} finally {
			this.update_group_loading = false
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

	async removeGroup(group_id: string) {
		if (!group_id) return

		await rpc.group.remove.mutate(group_id)

		if (this.selected_group_id === group_id) {
			this.selected_group_id = ''
		}

		if (this.editing_group_id === group_id) {
			this.closeGroupDialog()
		}

		this.menu_scope = 'group'
		await this.refreshGroups()
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

		if (key === 'role' && !next_value) {
			return
		}

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

	async setTools(tool_names: Array<string>) {
		if (!this.selected_agent_id) return

		await this.updateAgent({
			id: this.selected_agent_id,
			tools: tool_names
		})
	}

	setToolLogDate(date: string) {
		if (!date) return

		void this.refreshToolLogs({ date, page: 1 })
	}

	setToolLogPage(page: number) {
		if (page < 1) return

		void this.refreshToolLogs({ date: this.tool_log_date, page })
	}

	setSkillLogDate(date: string) {
		if (!date) return

		void this.refreshSkillLogs({ date, page: 1 })
	}

	setSkillLogPage(page: number) {
		if (page < 1) return

		void this.refreshSkillLogs({ date: this.skill_log_date, page })
	}

	async addArticle(article_id: string) {
		if (!this.selected_agent_id) return

		await rpc.agent.addArticle.mutate({
			agent_id: this.selected_agent_id,
			article_id,
			for_type: this.article_for
		})

		await this.refreshAgentRelated()
		this.article_search_list = this.article_search_list.filter(item => item.id !== article_id)
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

	async renameSession() {
		const rename_value = this.rename_value.trim()

		if (!rename_value) {
			this.onCancelRename()

			return
		}

		if (!this.rename_session_id) return

		await rpc.session.rename.mutate({ id: this.rename_session_id, title: rename_value })

		this.onCancelRename()

		await this.refreshSessions()
	}

	async removeSession(session_id: string) {
		await rpc.session.remove.mutate({ id: session_id })

		if (this.selected_session_id === session_id) {
			this.selected_session_id = ''
		}

		if (this.rename_session_id === session_id) {
			this.onCancelRename()
		}

		await this.refreshSessions()
	}

	async togglePinSession(session_id: string) {
		if (!this.selected_agent_id) return

		await rpc.agent.pin.mutate({
			agent_id: this.selected_agent_id,
			id: session_id,
			value: !this.pin_map[session_id]
		})

		await this.refreshSessions()
	}

	async sortPin(from: number, to: number) {
		if (!this.selected_agent_id) return
		if (from === to) return
		if (to < 0 || to > this.pins.length - 1) return

		this.pins = arrayMove(this.pins, from, to)

		await rpc.agent.sortPin.mutate({ agent_id: this.selected_agent_id, from, to })
		await this.refreshSessions()
	}

	patchSessionList(session_list: Array<AgentSessionItem>, payload: SessionStatusPayload): Array<AgentSessionItem> {
		return session_list.map(session_item => {
			const status = payload[session_item.id]

			if (!status) {
				return session_item
			}

			return {
				...session_item,
				title: status.title,
				report: status.report,
				is_runing: status.running,
				running_done: status.running_done ? new Date(status.running_done) : null,
				unread: status.unread
			}
		})
	}

	async hydrateSessionStatusMap() {
		const running_list = (await rpc.session.getStatusList.query({
			status: 'running'
		})) as Array<AgentSessionItem>
		const next_map = {} as SessionStatusPayload

		running_list.forEach(item => {
			next_map[item.id] = {
				title: item.title,
				report: item.report ?? null,
				running: item.is_runing,
				unread: item.unread ?? false,
				running_since: item.running_since ? new Date(item.running_since).getTime() : null,
				running_done: item.running_done ? new Date(item.running_done).getTime() : null,
				status: null
			}
		})

		this.session_status_map = next_map
	}

	watchSessionStatus() {
		const deinit = rpc.session.watchSessionStatus.subscribe(undefined, {
			onData: res => {
				if (!Object.keys(res).length) {
					return
				}

				const changed_session_ids = new Set(Object.keys(res))
				const has_group_session_change = this.groups.some(group =>
					group.session_ids?.some(session_id => changed_session_ids.has(session_id))
				)

				this.session_status_map = {
					...this.session_status_map,
					...res
				}
				this.pins = this.patchSessionList(this.pins, res)
				this.session_items = this.patchSessionList(this.session_items, res)

				if (has_group_session_change) {
					void this.refreshGroups()
				}
			}
		})

		this.util.acts.push(deinit.unsubscribe)
	}

	deinit() {
		this.util.deinit()
	}
}
