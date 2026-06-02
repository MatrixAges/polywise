import { arrayMove } from '@dnd-kit/sortable'
import { makeAutoObservable } from 'mobx'
import { setStorageWhenChange } from 'stk/mobx'
import { injectable } from 'tsyringe'

import { Files, Util } from '@/models/common'
import { alert, rpc } from '@/utils'

import type { Project, Session } from '@core/db'
import type { UIEvent } from 'react'
import type { ISessionMenuData } from './types'

type MenuTab = 'projects' | 'sessions' | 'im'
type SessionListKind = 'sessions' | 'im'
type ProjectListItem = {
	project: Project
	sessions: Array<Session>
	has_more: boolean
	loaded: boolean
	loading: boolean
}

const getRpcSessionKind = (kind: SessionListKind) => (kind === 'im' ? 'im' : 'default')

@injectable()
export default class Index {
	selected_project_id = ''
	project_selected_session_id = ''
	normal_selected_session_id = ''
	im_selected_session_id = ''
	files_project_id = ''
	files_session_id = ''
	rename_project_id = ''
	rename_session_id = ''
	rename_value = ''
	menu_tab = 'sessions' as MenuTab
	projects = [] as Array<ProjectListItem>
	normal_pins = [] as Array<Session>
	normal_sessions = [] as Array<Session>
	normal_pin_map = {} as Record<string, number>
	im_pins = [] as Array<Session>
	im_sessions = [] as Array<Session>
	im_pin_map = {} as Record<string, number>
	add_modal_open = false
	side_panel_open = false
	side_panel_tab = 'files' as 'files' | 'todos'
	content_tab = 'session' as 'session' | 'file'
	expand_project_ids = [] as Array<string>
	page_map = new Map<string, number>()
	normal_session_page = 1
	im_session_page = 1
	normal_sessions_loaded = false
	im_sessions_loaded = false
	loading = false
	normal_loading_more = false
	im_loading_more = false
	normal_has_more = true
	im_has_more = true
	temp_input = ''

	constructor(
		public util: Util,
		public modal_files: Files,
		public project_files: Files
	) {
		makeAutoObservable(
			this,
			{ util: false, modal_files: false, project_files: false, page_map: false },
			{ autoBind: true }
		)
	}

	get selected_session_id() {
		if (this.menu_tab === 'projects') {
			return this.project_selected_session_id
		}

		if (this.menu_tab === 'sessions') {
			return this.normal_selected_session_id
		}

		return this.im_selected_session_id
	}

	get pins() {
		return this.menu_tab === 'im' ? this.im_pins : this.normal_pins
	}

	get sessions() {
		return this.menu_tab === 'im' ? this.im_sessions : this.normal_sessions
	}

	get pin_map() {
		return this.menu_tab === 'im' ? this.im_pin_map : this.normal_pin_map
	}

	get has_more() {
		return this.menu_tab === 'im' ? this.im_has_more : this.normal_has_more
	}

	get loading_more() {
		return this.menu_tab === 'im' ? this.im_loading_more : this.normal_loading_more
	}

	get menu_selected_session_id() {
		return this.menu_tab === 'im' ? this.im_selected_session_id : this.normal_selected_session_id
	}

	async init() {
		const deinit = setStorageWhenChange(
			[
				'selected_project_id',
				'project_selected_session_id',
				'normal_selected_session_id',
				'im_selected_session_id',
				'menu_tab',
				{ project_side_panel_open: 'side_panel_open' },
				'files_project_id',
				'files_session_id',
				'expand_project_ids'
			],
			this
		)

		this.util.acts = [deinit]

		await this.getProjectList({ wait_for_visible_sessions: false })

		if (this.menu_tab === 'im') {
			await this.refreshSessions('im')
		} else if (this.menu_tab === 'sessions') {
			await this.refreshSessions('sessions')
		}

		void this.prefetchInactiveMenuData()

		this.watchSessionStatus()

		if (this.side_panel_open) {
			if (this.files_project_id) {
				await this.setFilesProjectId()
			} else if (this.files_session_id) {
				await this.setFilesSessionId(this.files_session_id)
			}
		}
	}

	setMenuTab(v: MenuTab) {
		this.menu_tab = v
		this.content_tab = 'session'

		if (v === 'projects') {
			if (!this.project_selected_session_id) return

			if (this.side_panel_open) {
				void this.setFilesProjectId()
			}

			return
		}

		if (v === 'im') {
			if (!this.im_sessions_loaded) {
				void this.refreshSessions('im')
			}
		} else if (!this.normal_sessions_loaded) {
			void this.refreshSessions('sessions')
		}

		const target_session_id = v === 'im' ? this.im_selected_session_id : this.normal_selected_session_id

		if (!target_session_id) return

		if (this.side_panel_open) {
			void this.setFilesSessionId(target_session_id)
		}
	}

	setSelectedProject(project_id: string) {
		this.menu_tab = 'projects'
		this.selected_project_id = project_id

		const index = this.expand_project_ids.findIndex(item => item === project_id)

		if (index !== -1) {
			this.expand_project_ids.splice(index, 1)
		} else {
			this.expand_project_ids.push(project_id)

			const project_index = this.projects.findIndex(item => item.project.id === project_id)

			if (project_index >= 0) {
				void this.loadProjectSessions(project_index)
			}
		}

		this.expand_project_ids = $copy(this.expand_project_ids)
	}

	selectProjectSession(args: { project_id: string; project_index: number; session_id: string }) {
		const { project_id, project_index, session_id } = args

		this.menu_tab = 'projects'
		this.selected_project_id = project_id
		this.project_selected_session_id = session_id
		this.content_tab = 'session'

		if (!this.expand_project_ids.includes(project_id)) {
			this.expand_project_ids.push(project_id)
			this.expand_project_ids = $copy(this.expand_project_ids)
		}

		if (this.side_panel_open) {
			void this.setFilesProjectId(project_index)
		}

		void this.loadProjectSessions(project_index)
	}

	selectSession(session_id: string) {
		if (this.menu_tab === 'im') {
			this.im_selected_session_id = session_id
		} else {
			this.menu_tab = 'sessions'
			this.normal_selected_session_id = session_id
		}
		this.content_tab = 'session'

		if (this.side_panel_open) {
			void this.setFilesSessionId(session_id)
		}
	}

	setSidePanelTab(v: Index['side_panel_tab']) {
		this.side_panel_tab = v
	}

	onRenameProject(project_id: string, title: string) {
		this.rename_project_id = project_id
		this.rename_session_id = ''
		this.rename_value = title
	}

	onRenameSession(session_id: string, title: string) {
		this.rename_project_id = ''
		this.rename_session_id = session_id
		this.rename_value = title
	}

	onChangeRenameValue(v: string) {
		this.rename_value = v
	}

	setRenameValue(v: string) {
		this.onChangeRenameValue(v)
	}

	onCancelRename() {
		this.rename_project_id = ''
		this.rename_session_id = ''
		this.rename_value = ''
	}

	closeFiles() {
		this.side_panel_open = false
		this.content_tab = 'session'
	}

	toggleFiles() {
		if (this.side_panel_open) {
			return this.closeFiles()
		}

		if (this.menu_tab === 'sessions' && this.normal_selected_session_id) {
			return void this.setFilesSessionId(this.normal_selected_session_id)
		}

		if (this.menu_tab === 'im' && this.im_selected_session_id) {
			return void this.setFilesSessionId(this.im_selected_session_id)
		}

		return void this.setFilesProjectId()
	}

	setContentTab(v: string) {
		this.content_tab = v as Index['content_tab']
	}

	async onToggleAddModal() {
		this.add_modal_open = !this.add_modal_open

		const home_dir = await rpc.file.homedir.query()

		if (this.add_modal_open) await this.modal_files.init(home_dir)
	}

	async setFilesProjectId(index?: number) {
		let project: Project | undefined

		if (!this.projects.length) return

		if (index !== undefined) {
			project = this.projects[index]?.project
		} else if (this.files_project_id) {
			project = this.projects.find(item => item.project.id === this.files_project_id)?.project
		} else if (this.selected_project_id) {
			project = this.projects.find(item => item.project.id === this.selected_project_id)?.project
		}

		if (!project) return

		const reuse_current_project_files =
			this.side_panel_open &&
			this.files_project_id === project.id &&
			this.project_files.root_path === project.dir

		this.files_project_id = project.id
		this.files_session_id = ''
		this.side_panel_open = true
		this.content_tab = 'session'

		if (reuse_current_project_files) return

		await this.project_files.init(project.dir, { dir_only: false, show_hidden: true })
	}

	async setFilesSessionId(session_id = this.selected_session_id) {
		if (!session_id) return

		const dir = await rpc.session.getFilesDir.query({ id: session_id })

		this.files_session_id = session_id
		this.files_project_id = ''
		this.side_panel_open = true
		this.content_tab = 'session'

		await this.project_files.init(dir, { dir_only: false, show_hidden: true })
	}

	private getSessionState(kind: SessionListKind) {
		return kind === 'im'
			? {
					selected_session_id: this.im_selected_session_id,
					setSelectedSessionId: (value: string) => {
						this.im_selected_session_id = value
					},
					setPins: (value: Array<Session>) => {
						this.im_pins = value
					},
					setSessions: (value: Array<Session>) => {
						this.im_sessions = value
					},
					setPinMap: (value: Record<string, number>) => {
						this.im_pin_map = value
					},
					setPage: (value: number) => {
						this.im_session_page = value
					},
					setHasMore: (value: boolean) => {
						this.im_has_more = value
					},
					getPage: () => this.im_session_page,
					getSessions: () => this.im_sessions,
					getPins: () => this.im_pins
				}
			: {
					selected_session_id: this.normal_selected_session_id,
					setSelectedSessionId: (value: string) => {
						this.normal_selected_session_id = value
					},
					setPins: (value: Array<Session>) => {
						this.normal_pins = value
					},
					setSessions: (value: Array<Session>) => {
						this.normal_sessions = value
					},
					setPinMap: (value: Record<string, number>) => {
						this.normal_pin_map = value
					},
					setPage: (value: number) => {
						this.normal_session_page = value
					},
					setHasMore: (value: boolean) => {
						this.normal_has_more = value
					},
					getPage: () => this.normal_session_page,
					getSessions: () => this.normal_sessions,
					getPins: () => this.normal_pins
				}
	}

	async refreshSessions(kind: SessionListKind = 'sessions') {
		this.loading = true

		try {
			const res = (await rpc.session.getList.query({
				kind: getRpcSessionKind(kind)
			})) as ISessionMenuData
			const state = this.getSessionState(kind)

			state.setPins(res.pins)
			state.setSessions(res.sessions)
			state.setPinMap(res.pin_map)
			state.setPage(1)
			state.setHasMore(res.has_more)

			const session_id_list = state
				.getPins()
				.map(item => item.id)
				.concat(state.getSessions().map(item => item.id))

			if (state.selected_session_id && !session_id_list.includes(state.selected_session_id)) {
				state.setSelectedSessionId('')
			}

			if (kind === 'im') {
				this.im_sessions_loaded = true
			} else {
				this.normal_sessions_loaded = true
			}
		} finally {
			this.loading = false
		}
	}

	onScroll(event: UIEvent<HTMLDivElement>) {
		const target = event.currentTarget
		const is_near_bottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 24

		if (is_near_bottom) {
			this.loadMore()
		}
	}

	async loadMore(kind: SessionListKind = this.menu_tab === 'im' ? 'im' : 'sessions') {
		if (this.loading) return
		if (kind === 'im' ? this.im_loading_more : this.normal_loading_more) return
		if (kind === 'im' ? !this.im_has_more : !this.normal_has_more) return

		if (kind === 'im') {
			this.im_loading_more = true
		} else {
			this.normal_loading_more = true
		}

		try {
			const state = this.getSessionState(kind)
			const res = (await rpc.session.getMoreList.query({
				page: state.getPage(),
				kind: getRpcSessionKind(kind)
			})) as Array<Session>

			state.setSessions([...state.getSessions(), ...res])
			state.setPage(state.getPage() + 1)
			state.setHasMore(res.length >= 10)
		} finally {
			if (kind === 'im') {
				this.im_loading_more = false
			} else {
				this.normal_loading_more = false
			}
		}
	}

	async getProjectList(args: { wait_for_visible_sessions?: boolean } = {}) {
		const { wait_for_visible_sessions = true } = args
		const data = (await rpc.project.getList.query()) as Array<{
			project: Project
			sessions: Array<Session>
			has_more: boolean
		}>
		const prev_project_map = new Map(this.projects.map(item => [item.project.id, item]))

		this.projects = data.map(item => {
			const prev_item = prev_project_map.get(item.project.id)

			return {
				project: item.project,
				sessions: prev_item?.sessions ?? [],
				has_more: prev_item?.has_more ?? false,
				loaded: prev_item?.loaded ?? false,
				loading: false
			}
		})

		if (this.selected_project_id) {
			const exists = data.some(item => item.project.id === this.selected_project_id)

			if (!exists) {
				this.selected_project_id = ''
				this.project_selected_session_id = ''
			}
		}

		const sync_visible_project_sessions = this.syncVisibleProjectSessions()

		if (wait_for_visible_sessions) {
			await sync_visible_project_sessions
		} else {
			void sync_visible_project_sessions
		}
	}

	async getMoreSessions(project_index: number) {
		const project_id = this.projects[project_index].project.id
		const page = this.page_map.has(project_id) ? this.page_map.get(project_id)! + 1 : 1

		await this.loadProjectSessions(project_index, { page, append: page > 1, force: page === 1 })
	}

	async sortProject(from: number, to: number) {
		if (from === to) return

		const from_index = this.expand_project_ids.findIndex(item => item === this.projects[from].project.id)

		if (from_index !== -1) {
			this.expand_project_ids.splice(from_index, 1)
		}

		const to_index = this.expand_project_ids.findIndex(item => item === this.projects[to].project.id)

		if (to_index !== -1) {
			this.expand_project_ids.splice(to_index, 1)
		}

		if (to < 0 || to > this.projects.length - 1) return

		this.projects = arrayMove(this.projects, from, to)

		await rpc.project.sort.mutate({ from, to })

		await this.getProjectList()
	}

	async sortPin(from: number, to: number) {
		if (from === to) return
		if (to < 0 || to > this.pins.length - 1) return

		const from_id = this.pins[from]?.id
		const to_id = this.pins[to]?.id
		const global_from = from_id ? this.pin_map[from_id] : undefined
		const global_to = to_id ? this.pin_map[to_id] : undefined

		if (global_from === undefined || global_to === undefined) {
			return
		}

		if (this.menu_tab === 'im') {
			this.im_pins = arrayMove(this.im_pins, from, to)
		} else {
			this.normal_pins = arrayMove(this.normal_pins, from, to)
		}

		await rpc.session.sortPin.mutate({ from: global_from, to: global_to })
		await this.refreshSessions(this.menu_tab === 'im' ? 'im' : 'sessions')
	}

	async createProject() {
		const input_path = this.modal_files.input_path.trim()

		if (!input_path) return

		this.add_modal_open = false

		await rpc.project.create.mutate({ dir: input_path })

		await this.getProjectList()

		this.modal_files.reset()
	}

	async renameProject(project_item: Project) {
		if (!this.rename_value) return this.onCancelRename()

		await rpc.project.rename.mutate({ id: project_item.id, name: this.rename_value })

		this.onCancelRename()

		await this.getProjectList()
	}

	async removeProject(project_item: Project) {
		const res = await alert({
			title: 'Remove Project',
			desc: 'Confirm remove project and all related sessions?'
		})

		if (!res) return

		if (this.selected_project_id === project_item.id) {
			this.selected_project_id = ''
			this.project_selected_session_id = ''
		}

		if (this.files_project_id === project_item.id) {
			this.closeFiles()
			this.files_project_id = ''
		}

		await rpc.project.remove.mutate({ id: project_item.id })

		await Promise.all([this.getProjectList(), this.refreshSessions('sessions'), this.refreshSessions('im')])
	}

	async createSession(project_id?: string, input?: string) {
		const input_text = typeof input === 'string' ? input : ''
		const should_keep_side_panel_open = this.side_panel_open
		const res = await rpc.session.create.mutate({ project_id })

		if (!res) return

		this.content_tab = 'session'

		if (project_id) {
			this.menu_tab = 'projects'
			this.selected_project_id = project_id
			this.project_selected_session_id = res.id

			if (!this.expand_project_ids.includes(project_id)) {
				this.expand_project_ids.push(project_id)
				this.expand_project_ids = $copy(this.expand_project_ids)
			}

			await this.getProjectList()

			const project_index = this.projects.findIndex(item => item.project.id === project_id)

			if (should_keep_side_panel_open && project_index >= 0) {
				await this.setFilesProjectId(project_index)
			}
		} else {
			this.menu_tab = 'sessions'
			this.normal_selected_session_id = res.id

			await this.refreshSessions('sessions')

			if (this.side_panel_open) {
				await this.setFilesSessionId(res.id)
			}
		}

		if (input_text) {
			this.temp_input = input_text

			setTimeout(() => {
				this.temp_input = ''
			}, 1200)
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

		await Promise.all([this.getProjectList(), this.refreshSessions('sessions'), this.refreshSessions('im')])
	}

	async removeSession(session_id: string) {
		await rpc.session.remove.mutate({ id: session_id })

		if (this.project_selected_session_id === session_id) {
			this.project_selected_session_id = ''
		}

		if (this.normal_selected_session_id === session_id) {
			this.normal_selected_session_id = ''
		}

		if (this.im_selected_session_id === session_id) {
			this.im_selected_session_id = ''
		}

		if (this.rename_session_id === session_id) {
			this.onCancelRename()
		}

		if (this.files_session_id === session_id) {
			this.closeFiles()
			this.files_session_id = ''
		}

		await Promise.all([this.getProjectList(), this.refreshSessions('sessions'), this.refreshSessions('im')])
	}

	async togglePinSession(id: string) {
		await rpc.session.pin.mutate({ id, value: !this.pin_map[id] })

		await this.refreshSessions(this.menu_tab === 'im' ? 'im' : 'sessions')
	}

	watchSessionStatus() {
		const deinit = rpc.session.watchSessionStatus.subscribe(undefined, {
			onData: res => {
				const entries = Object.entries(res)

				if (!entries.length) {
					return
				}

				this.projects = this.projects.map(project_item => ({
					...project_item,
					sessions: project_item.sessions.map(session_item => {
						const status = res[session_item.id]

						if (status) {
							return {
								...session_item,
								title: status.title,
								report: status.report,
								is_runing: status.running,
								running_done: status.running_done
									? new Date(status.running_done)
									: null,
								unread: status.unread
							}
						}

						return session_item
					})
				}))

				this.normal_sessions = this.normal_sessions.map(session_item => {
					const status = res[session_item.id]

					if (status) {
						return {
							...session_item,
							title: status.title,
							report: status.report,
							is_runing: status.running,
							running_done: status.running_done ? new Date(status.running_done) : null,
							unread: status.unread
						}
					}

					return session_item
				})

				this.normal_pins = this.normal_pins.map(session_item => {
					const status = res[session_item.id]

					if (status) {
						return {
							...session_item,
							title: status.title,
							report: status.report,
							is_runing: status.running,
							running_done: status.running_done ? new Date(status.running_done) : null,
							unread: status.unread
						}
					}

					return session_item
				})

				this.im_sessions = this.im_sessions.map(session_item => {
					const status = res[session_item.id]

					if (status) {
						return {
							...session_item,
							title: status.title,
							report: status.report,
							is_runing: status.running,
							running_done: status.running_done ? new Date(status.running_done) : null,
							unread: status.unread
						}
					}

					return session_item
				})

				this.im_pins = this.im_pins.map(session_item => {
					const status = res[session_item.id]

					if (status) {
						return {
							...session_item,
							title: status.title,
							report: status.report,
							is_runing: status.running,
							running_done: status.running_done ? new Date(status.running_done) : null,
							unread: status.unread
						}
					}

					return session_item
				})
			}
		})

		this.util.acts.push(deinit.unsubscribe)
	}

	deinit() {
		this.util.deinit()
	}

	private prefetchInactiveMenuData() {
		const tasks: Array<Promise<unknown>> = []

		if (this.menu_tab !== 'sessions' && !this.normal_sessions_loaded) {
			tasks.push(this.refreshSessions('sessions'))
		}

		if (this.menu_tab !== 'im' && !this.im_sessions_loaded) {
			tasks.push(this.refreshSessions('im'))
		}

		if (!tasks.length) return

		void Promise.allSettled(tasks)
	}

	private async syncVisibleProjectSessions() {
		const visible_project_ids = new Set(this.expand_project_ids)

		if (this.selected_project_id) {
			visible_project_ids.add(this.selected_project_id)
		}

		await Promise.all(
			Array.from(visible_project_ids, project_id => {
				const project_index = this.projects.findIndex(item => item.project.id === project_id)

				if (project_index < 0) {
					return Promise.resolve()
				}

				return this.loadProjectSessions(project_index, { force: true })
			})
		)
	}

	private async loadProjectSessions(
		project_index: number,
		args: { page?: number; append?: boolean; force?: boolean } = {}
	) {
		const project_item = this.projects[project_index]

		if (!project_item) return

		const { page = 1, append = false, force = false } = args

		if (project_item.loading) return
		if (!force && page === 1 && project_item.loaded) return

		project_item.loading = true

		try {
			const res = await rpc.project.getMoreSessions.query({
				project_id: project_item.project.id,
				page
			})

			this.page_map.set(project_item.project.id, page)
			project_item.sessions = append
				? project_item.sessions.concat(res.sessions as Array<Session>)
				: (res.sessions as Array<Session>)
			project_item.has_more = res.has_more
			project_item.loaded = true
		} finally {
			const current_project_item = this.projects[project_index]

			if (current_project_item?.project.id === project_item.project.id) {
				current_project_item.loading = false
			}
		}
	}
}
