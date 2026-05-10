import { arrayMove } from '@dnd-kit/sortable'
import { makeAutoObservable } from 'mobx'
import { setStorageWhenChange } from 'stk/mobx'
import { injectable } from 'tsyringe'

import { Files, Util } from '@/models/common'
import { alert, rpc } from '@/utils'

import type { Project, Session } from '@core/db'
import type { UIEvent } from 'react'
import type { ISessionMenuData } from './types'

type MenuTab = 'projects' | 'sessions'
type SelectedSessionSource = '' | 'project' | 'session'

@injectable()
export default class Index {
	selected_project_id = ''
	selected_session_id = ''
	selected_session_source = '' as SelectedSessionSource
	files_project_id = ''
	files_session_id = ''
	rename_project_id = ''
	rename_session_id = ''
	rename_value = ''
	menu_tab = 'projects' as MenuTab
	projects = [] as Array<{ project: Project; sessions: Array<Session>; has_more: boolean }>
	pins = [] as Array<Session>
	sessions = [] as Array<Session>
	pin_map = {} as Record<string, number>
	add_modal_open = false
	side_panel_open = false
	side_panel_tab = 'files' as 'files' | 'todos'
	content_tab = 'session' as 'session' | 'file'
	expand_project_ids = [] as Array<string>
	page_map = new Map<string, number>()
	session_page = 1
	loading = false
	loading_more = false
	has_more = true
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

	async init() {
		const deinit = setStorageWhenChange(
			[
				{ project_selected_project_id: 'selected_project_id' },
				{ project_selected_session_id: 'selected_session_id' },
				'selected_session_source',
				'menu_tab',
				{ project_side_panel_open: 'side_panel_open' },
				'files_project_id',
				'files_session_id',
				'expand_project_ids'
			],
			this
		)

		this.util.acts = [deinit]

		await Promise.all([this.getProjectList(), this.refreshSessions()])

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
	}

	setSelectedProject(project_id: string) {
		this.menu_tab = 'projects'
		this.selected_project_id = project_id

		const index = this.expand_project_ids.findIndex(item => item === project_id)

		if (index !== -1) {
			this.expand_project_ids.splice(index, 1)
		} else {
			this.expand_project_ids.push(project_id)
		}

		this.expand_project_ids = $copy(this.expand_project_ids)
	}

	selectProjectSession(args: { project_id: string; project_index: number; session_id: string }) {
		const { project_id, project_index, session_id } = args

		this.menu_tab = 'projects'
		this.selected_project_id = project_id
		this.selected_session_id = session_id
		this.selected_session_source = 'project'
		this.content_tab = 'session'

		if (!this.expand_project_ids.includes(project_id)) {
			this.expand_project_ids.push(project_id)
			this.expand_project_ids = $copy(this.expand_project_ids)
		}

		void this.setFilesProjectId(project_index)
	}

	selectGlobalSession(session_id: string) {
		this.menu_tab = 'sessions'
		this.selected_session_id = session_id
		this.selected_session_source = 'session'
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

		if (this.selected_session_source === 'session' && this.selected_session_id) {
			return void this.setFilesSessionId(this.selected_session_id)
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

		this.files_project_id = project.id
		this.files_session_id = ''
		this.side_panel_open = true
		this.content_tab = 'session'

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

	async refreshSessions() {
		this.loading = true

		try {
			const res = (await rpc.session.getList.query()) as ISessionMenuData

			this.pins = res.pins
			this.sessions = res.sessions
			this.pin_map = res.pin_map
			this.session_page = 1
			this.has_more = res.has_more

			const session_id_list = this.pins.map(item => item.id).concat(this.sessions.map(item => item.id))

			if (this.selected_session_source === 'session' && this.selected_session_id) {
				if (!session_id_list.includes(this.selected_session_id)) {
					this.selected_session_id = ''
					this.selected_session_source = ''
				}
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

	async loadMore() {
		if (this.loading) return
		if (this.loading_more) return
		if (!this.has_more) return

		this.loading_more = true

		try {
			const res = (await rpc.session.getMoreList.query({ page: this.session_page })) as Array<Session>

			this.sessions = [...this.sessions, ...res]
			this.session_page += 1
			this.has_more = res.length >= 10
		} finally {
			this.loading_more = false
		}
	}

	async getProjectList() {
		const data = (await rpc.project.getList.query()) as Index['projects']

		this.projects = data
	}

	async getMoreSessions(project_index: number) {
		const project_id = this.projects[project_index].project.id

		const page = this.page_map.has(project_id) ? this.page_map.get(project_id)! + 1 : 2

		const res = await rpc.project.getMoreSessions.query({ project_id, page })

		this.page_map.set(project_id, page)

		this.projects[project_index].has_more = res.has_more
		this.projects[project_index].sessions.push(...(res.sessions as Array<Session>))
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

		this.pins = arrayMove(this.pins, from, to)

		await rpc.session.sortPin.mutate({ from, to })
		await this.refreshSessions()
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

			if (this.selected_session_source === 'project') {
				this.selected_session_id = ''
				this.selected_session_source = ''
			}
		}

		if (this.files_project_id === project_item.id) {
			this.closeFiles()
			this.files_project_id = ''
		}

		await rpc.project.remove.mutate({ id: project_item.id })

		await Promise.all([this.getProjectList(), this.refreshSessions()])
	}

	async createSession(project_id?: string, input?: string) {
		const input_text = typeof input === 'string' ? input : ''
		const res = await rpc.session.create.mutate({ project_id })

		if (!res) return

		this.selected_session_id = res.id
		this.content_tab = 'session'

		if (project_id) {
			this.menu_tab = 'projects'
			this.selected_project_id = project_id
			this.selected_session_source = 'project'

			if (!this.expand_project_ids.includes(project_id)) {
				this.expand_project_ids.push(project_id)
				this.expand_project_ids = $copy(this.expand_project_ids)
			}

			await this.getProjectList()

			const project_index = this.projects.findIndex(item => item.project.id === project_id)

			if (project_index >= 0) {
				await this.setFilesProjectId(project_index)
			}
		} else {
			this.menu_tab = 'sessions'
			this.selected_session_source = 'session'

			await this.refreshSessions()

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

		await Promise.all([this.getProjectList(), this.refreshSessions()])
	}

	async removeSession(session_id: string) {
		await rpc.session.remove.mutate({ id: session_id })

		if (this.selected_session_id === session_id) {
			this.selected_session_id = ''
			this.selected_session_source = ''
		}

		if (this.rename_session_id === session_id) {
			this.onCancelRename()
		}

		if (this.files_session_id === session_id) {
			this.closeFiles()
			this.files_session_id = ''
		}

		await Promise.all([this.getProjectList(), this.refreshSessions()])
	}

	async togglePinSession(id: string) {
		await rpc.session.pin.mutate({ id, value: !this.pin_map[id] })

		await this.refreshSessions()
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

				this.sessions = this.sessions.map(session_item => {
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

				this.pins = this.pins.map(session_item => {
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
}
