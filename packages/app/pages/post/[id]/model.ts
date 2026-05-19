import { makeAutoObservable } from 'mobx'
import { toast } from 'sonner'
import { setStorageWhenChange } from 'stk/mobx'
import { injectable } from 'tsyringe'

import { Util } from '@/models/common'
import { rpc } from '@/utils'

import { normalizeHeadingText, parseOutline } from '../utils'

import type { Editor as TiptapEditor } from '@tiptap/core'
import type {
	DetailTab,
	PostDetail,
	PostForType,
	ProjectOptionItem,
	RelatedArticle,
	RelatedProject,
	RelatedSearchItem
} from '../types'

const detail_tabs = ['outline', 'related', 'project'] as const satisfies Array<DetailTab>

@injectable()
export default class Index {
	route_post_id = ''
	detail_tab = 'outline' as DetailTab
	selected_post = null as PostDetail | null
	draft_title = ''
	draft_content = ''
	draft_for_type = 'user' as PostForType
	post_loading = false
	saving = false
	extracting = false
	dirty = false
	session_id = null as string | null
	related_articles = [] as Array<RelatedArticle>
	related_loading = false
	related_search = ''
	related_search_loading = false
	related_search_list = [] as Array<RelatedSearchItem>
	related_projects = [] as Array<RelatedProject>
	related_projects_loading = false
	related_project_options = [] as Array<ProjectOptionItem>
	related_project_options_loading = false
	project_dialog_open = false
	project_query = ''
	ensuring_session = false
	session_panel_open = false
	session_draft_input = null as { key: string; value: string } | null
	not_found = false
	editor_area = null as HTMLDivElement | null
	save_timer = 0 as ReturnType<typeof setTimeout> | 0
	search_timer = 0 as ReturnType<typeof setTimeout> | 0
	read_request_key = ''
	related_search_request_key = ''
	save_promise = null as Promise<PostDetail | null> | null
	session_running = false

	constructor(public util: Util) {
		makeAutoObservable(
			this,
			{
				util: false,
				editor_area: false,
				save_timer: false,
				search_timer: false,
				read_request_key: false,
				related_search_request_key: false,
				save_promise: false,
				session_running: false
			},
			{ autoBind: true }
		)
	}

	get outline_items() {
		return parseOutline(this.draft_content)
	}

	get related_project_id_set() {
		return new Set(this.related_projects.map(item => item.id))
	}

	get filtered_related_project_options() {
		const keyword = this.project_query.trim().toLowerCase()
		const related_project_id_set = this.related_project_id_set

		return this.related_project_options.filter(item => {
			if (related_project_id_set.has(item.id)) {
				return false
			}

			if (!keyword) {
				return true
			}

			return `${item.name}\n${item.dir}`.toLowerCase().includes(keyword)
		})
	}

	async init() {
		const deinit = setStorageWhenChange(
			[
				{
					detail_tab: {
						local_key: 'post_detail_tab',
						fromStorage: value =>
							detail_tabs.includes(value as DetailTab) ? (value as DetailTab) : 'outline',
						toStorage: value =>
							detail_tabs.includes(value as DetailTab) ? (value as DetailTab) : 'outline'
					}
				}
			],
			this
		)

		this.util.acts = [deinit]
		this.watchSessionStatus()
		this.bindSaveHotKey()
	}

	deinit() {
		this.clearSaveTimer()
		this.clearSearchTimer()

		if (this.dirty && this.route_post_id) {
			void this.saveCurrentPost({ silent: true, force: true })
		}

		this.util.deinit()
	}

	setEditorArea(value: HTMLDivElement | null) {
		this.editor_area = value
	}

	async setRoutePostId(post_id: string) {
		if (!post_id) {
			this.route_post_id = ''
			this.selected_post = null

			return null
		}

		if (this.route_post_id === post_id && this.selected_post?.id === post_id) {
			return this.selected_post
		}

		this.session_draft_input = null
		this.related_search = ''
		this.related_search_list = []
		this.related_search_loading = false
		this.related_projects = []
		this.related_projects_loading = false
		this.project_dialog_open = false
		this.project_query = ''
		this.clearSearchTimer()

		if (this.route_post_id && this.route_post_id !== post_id && this.dirty) {
			await this.saveCurrentPost({ silent: true, force: true })
		}

		this.route_post_id = post_id

		return this.loadPost(post_id)
	}

	setDetailTab(value: DetailTab) {
		this.detail_tab = value

		if (value === 'related' && this.route_post_id) {
			void this.loadRelatedArticles(this.route_post_id)
			this.scheduleRelatedSearch()
		}

		if (value === 'project' && this.route_post_id) {
			void this.loadRelatedProjects(this.route_post_id)
		}

		if (value !== 'related') {
			this.clearSearchTimer()
			this.related_search_list = []
			this.related_search_loading = false
		}
	}

	setDraftTitle(value: string) {
		this.draft_title = value
		this.markDirty()
	}

	setDraftContent(value: string) {
		this.draft_content = value
		this.markDirty()
	}

	setDraftForType(value: PostForType) {
		this.draft_for_type = value
		this.markDirty()
	}

	setRelatedSearch(value: string) {
		this.related_search = value
		this.scheduleRelatedSearch()
	}

	clearRelatedSearch() {
		this.related_search = ''
		this.related_search_list = []
		this.related_search_loading = false
		this.clearSearchTimer()
	}

	setProjectDialogOpen(value: boolean) {
		this.project_dialog_open = value

		if (value) {
			void this.loadRelatedProjectOptions()

			return
		}

		this.project_query = ''
	}

	setProjectQuery(value: string) {
		this.project_query = value
	}

	clearProjectQuery() {
		this.project_query = ''
	}

	setSessionPanelOpen(value: boolean) {
		this.session_panel_open = value
	}

	toggleSessionPanel() {
		this.session_panel_open = !this.session_panel_open

		if (this.session_panel_open && this.route_post_id && !this.session_id && !this.ensuring_session) {
			void this.ensureSession()
		}
	}

	markDirty() {
		this.dirty = true
		this.scheduleAutoSave()
	}

	clearSaveTimer() {
		if (this.save_timer) {
			clearTimeout(this.save_timer)
			this.save_timer = 0
		}
	}

	clearSearchTimer() {
		if (this.search_timer) {
			clearTimeout(this.search_timer)
			this.search_timer = 0
		}
	}

	scheduleAutoSave() {
		this.clearSaveTimer()

		if (!this.dirty || !this.route_post_id) {
			return
		}

		this.save_timer = setTimeout(() => {
			void this.saveCurrentPost({ silent: true })
		}, 10_000)
	}

	scheduleRelatedSearch() {
		this.clearSearchTimer()

		if (!this.route_post_id || this.detail_tab !== 'related' || !this.related_search.trim()) {
			this.related_search_list = []
			this.related_search_loading = false

			return
		}

		this.related_search_loading = true
		const request_key = `${this.route_post_id}:${this.related_search.trim()}:${Date.now()}`

		this.related_search_request_key = request_key
		this.search_timer = setTimeout(() => {
			void rpc.post.article.search
				.query({
					post_id: this.route_post_id,
					query: this.related_search.trim(),
					page: 1
				})
				.then(response => {
					if (this.related_search_request_key === request_key) {
						this.related_search_list = response.list
					}
				})
				.finally(() => {
					if (this.related_search_request_key === request_key) {
						this.related_search_loading = false
					}
				})
		}, 280)
	}

	applyPostDraft(response: PostDetail) {
		this.selected_post = response
		this.draft_title = response.title ?? ''
		this.draft_content = response.content
		this.draft_for_type = response.for_type
		this.session_id = response.session_id
		this.dirty = false
		this.clearSaveTimer()
	}

	async loadPost(id: string) {
		if (!id) {
			return null
		}

		const request_key = `${id}:${Date.now()}`

		this.read_request_key = request_key
		this.post_loading = true
		this.not_found = false

		try {
			const response = await rpc.post.read.query({ id })

			if (this.read_request_key !== request_key) {
				return response
			}

			this.applyPostDraft(response)

			if (this.detail_tab === 'related') {
				void this.loadRelatedArticles(response.id)
			}

			if (this.detail_tab === 'project') {
				void this.loadRelatedProjects(response.id)
			}

			return response
		} catch (error) {
			if (this.read_request_key === request_key) {
				this.not_found = true
				this.selected_post = null
			}

			return null
		} finally {
			if (this.read_request_key === request_key) {
				this.post_loading = false
			}
		}
	}

	async reloadCurrentPost() {
		if (!this.route_post_id) {
			return null
		}

		const response = await rpc.post.read.query({ id: this.route_post_id })

		this.selected_post = response
		this.session_id = response.session_id

		if (!this.dirty) {
			this.applyPostDraft(response)
		}

		return response
	}

	async saveCurrentPost(args?: { silent?: boolean; force?: boolean }) {
		if (!this.route_post_id) {
			return null
		}

		if (!args?.force && !this.dirty) {
			return this.selected_post
		}

		if (this.save_promise) {
			return this.save_promise
		}

		const next_title = this.draft_title
		const next_content = this.draft_content
		const next_for_type = this.draft_for_type

		this.saving = true
		this.clearSaveTimer()

		const promise = rpc.post.update
			.mutate({
				id: this.route_post_id,
				title: next_title,
				content: next_content,
				for_type: next_for_type
			})
			.then(response => {
				if (!response) {
					return null
				}

				this.selected_post = response
				this.session_id = response.session_id

				if (
					this.draft_title === next_title &&
					this.draft_content === next_content &&
					this.draft_for_type === next_for_type
				) {
					this.applyPostDraft(response)
				}

				if (!args?.silent) {
					toast.success('Post saved.')
				}

				return response
			})
			.catch(error => {
				if (!args?.silent) {
					toast.error(error instanceof Error ? error.message : String(error))
				}

				throw error
			})
			.finally(() => {
				this.save_promise = null
				this.saving = false
			})

		this.save_promise = promise

		return promise
	}

	async ensureSession() {
		if (!this.route_post_id) {
			return null
		}

		if (this.session_id) {
			return this.session_id
		}

		this.ensuring_session = true

		try {
			if (this.dirty) {
				await this.saveCurrentPost({ silent: true, force: true })
			}

			const response = await rpc.post.session.ensure.mutate({
				post_id: this.route_post_id
			})

			this.session_id = response.session_id

			if (this.selected_post) {
				this.selected_post = {
					...this.selected_post,
					session_id: response.session_id
				}
			}

			return response.session_id
		} finally {
			this.ensuring_session = false
		}
	}

	async loadRelatedArticles(post_id = this.route_post_id) {
		if (!post_id) {
			this.related_articles = []

			return
		}

		this.related_loading = true

		try {
			const response = await rpc.post.article.query.query({ post_id })

			if ((this.selected_post?.id ?? this.route_post_id) === post_id) {
				this.related_articles = response
			}
		} finally {
			this.related_loading = false
		}
	}

	async loadRelatedProjects(post_id = this.route_post_id) {
		if (!post_id) {
			this.related_projects = []

			return
		}

		this.related_projects_loading = true

		try {
			const response = await rpc.post.project.query.query({ post_id })

			if ((this.selected_post?.id ?? this.route_post_id) === post_id) {
				this.related_projects = response
			}
		} finally {
			this.related_projects_loading = false
		}
	}

	async loadRelatedProjectOptions(args?: { force?: boolean }) {
		if (this.related_project_options_loading) {
			return
		}

		if (!args?.force && this.related_project_options.length > 0) {
			return
		}

		this.related_project_options_loading = true

		try {
			this.related_project_options = await rpc.project.list.query()
		} finally {
			this.related_project_options_loading = false
		}
	}

	async addRelatedArticle(article_id: string) {
		if (!this.route_post_id) {
			return
		}

		await rpc.post.article.add.mutate({
			post_id: this.route_post_id,
			article_id
		})
		await Promise.all([this.loadRelatedArticles(), this.reloadCurrentPost()])
		this.related_search_list = this.related_search_list.filter(item => item.id !== article_id)
	}

	async removeRelatedArticle(article_id: string) {
		if (!this.route_post_id) {
			return
		}

		await rpc.post.article.remove.mutate({
			post_id: this.route_post_id,
			article_id
		})
		await Promise.all([this.loadRelatedArticles(), this.reloadCurrentPost()])
	}

	async addRelatedProject(project_id: string) {
		if (!this.route_post_id) {
			return
		}

		await rpc.post.project.add.mutate({
			post_id: this.route_post_id,
			project_id
		})
		await Promise.all([this.loadRelatedProjects(), this.reloadCurrentPost()])
		this.clearProjectQuery()
	}

	async removeRelatedProject(project_id: string) {
		if (!this.route_post_id) {
			return
		}

		await rpc.post.project.remove.mutate({
			post_id: this.route_post_id,
			project_id
		})
		await Promise.all([this.loadRelatedProjects(), this.reloadCurrentPost()])
	}

	scrollToOutlineItem(item: { text: string; level: number }) {
		const scroll_host = this.editor_area?.querySelector('.editor_wrap') as HTMLDivElement | null

		if (!scroll_host) {
			return
		}

		const headings = Array.from(scroll_host.querySelectorAll(`h${item.level}`)) as Array<HTMLHeadingElement>
		const target = headings.find(
			heading => normalizeHeadingText(heading.textContent ?? '') === normalizeHeadingText(item.text)
		)

		if (!target) {
			return
		}

		const host_rect = scroll_host.getBoundingClientRect()
		const target_rect = target.getBoundingClientRect()
		const next_top = scroll_host.scrollTop + (target_rect.top - host_rect.top) - 24

		scroll_host.scrollTo({
			top: Math.max(0, next_top),
			behavior: 'smooth'
		})
	}

	async addReferenceToPostSessionInput(editor: TiptapEditor) {
		if (!this.route_post_id) {
			return
		}

		const { from, to } = editor.state.selection
		const text_before_selection = editor.state.doc.textBetween(0, from, '\n')
		const selection_text = editor.state.doc.textBetween(from, to, '\n')

		if (!selection_text.trim()) {
			return
		}

		await this.saveCurrentPost({ silent: true })

		const selection_start = text_before_selection.length
		const selection_end = selection_start + selection_text.length
		const prompt = `REFERENCE: [${selection_start},${selection_end}]`

		this.setSessionPanelOpen(true)
		const next_session_id = await this.ensureSession()

		if (!next_session_id) {
			return
		}

		this.session_draft_input = {
			key: `${this.route_post_id}:${Date.now()}`,
			value: prompt
		}
	}

	async deletePost() {
		const deleting_post = this.selected_post

		if (!deleting_post) {
			return false
		}

		if (!window.confirm(`Delete post "${deleting_post.title || 'Untitled'}"?`)) {
			return false
		}

		await rpc.post.remove.mutate({ id: deleting_post.id })
		toast.success('Post removed.')

		return true
	}

	async extractPost() {
		if (!this.selected_post) {
			return
		}

		await this.saveCurrentPost({ silent: true })
		this.extracting = true

		try {
			const result = await rpc.post.extract.mutate({
				id: this.selected_post.id,
				force: this.selected_post.is_pipelined
			})

			toast.success(result.queued ? 'Extract queued.' : 'Extract completed.')
			await this.reloadCurrentPost()
		} finally {
			this.extracting = false
		}
	}

	watchSessionStatus() {
		const deinit = rpc.session.watchSessionStatus.subscribe(undefined, {
			onData: response => {
				const current_session_id = this.session_id

				if (!current_session_id) {
					return
				}

				const status = response[current_session_id]

				if (!status) {
					return
				}

				const previous_running = this.session_running

				this.session_running = status.running

				if (previous_running && !status.running) {
					void this.reloadCurrentPost()

					if (this.detail_tab === 'related') {
						void this.loadRelatedArticles()
					}

					if (this.detail_tab === 'project') {
						void this.loadRelatedProjects()
					}
				}
			}
		})

		this.util.acts.push(deinit.unsubscribe)
	}

	bindSaveHotKey() {
		const onKeyDown = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
				event.preventDefault()
				void this.saveCurrentPost()
			}
		}

		window.addEventListener('keydown', onKeyDown)
		this.util.acts.push(() => window.removeEventListener('keydown', onKeyDown))
	}
}
