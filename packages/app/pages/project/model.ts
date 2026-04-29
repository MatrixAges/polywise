import { arrayMove } from '@dnd-kit/sortable'
import { makeAutoObservable } from 'mobx'
import { setStorageWhenChange } from 'stk/mobx'
import { injectable } from 'tsyringe'

import { Files, Util } from '@/models/common'
import { alert, rpc } from '@/utils'

import type { Project, Session } from '@core/db'

@injectable()
export default class Index {
	selected_project_id = ''
	selected_session_id = ''
	files_project_id = ''
	rename_project_id = ''
	rename_session_id = ''
	rename_value = ''
	projects = [] as Array<{ project: Project; sessions: Array<Session>; has_more: boolean }>
	add_modal_open = false
	side_panel_open = false
	expand_project_ids = [] as Array<string>
	page_map = new Map<string, number>()

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
				'files_project_id',
				'expand_project_ids'
			],
			this
		)

		this.util.acts = [deinit]

		await this.getProjectList()

		this.watchSessionStatus()
	}

	setSelectedProject(project_id: string, click_by_session?: boolean) {
		this.selected_project_id = project_id

		if (click_by_session) return

		const index = this.expand_project_ids.findIndex(item => item === project_id)

		if (index !== -1) {
			this.expand_project_ids.splice(index, 1)
		} else {
			this.expand_project_ids.push(project_id)
		}

		this.expand_project_ids = $copy(this.expand_project_ids)
	}

	setSelectedSession(session_id: string) {
		this.selected_session_id = session_id
	}

	onRenameProject(project_id: string, title: string) {
		this.rename_project_id = project_id
		this.rename_value = title
	}

	onRenameSession(session_id: string, title: string) {
		this.rename_session_id = session_id
		this.rename_value = title
	}

	onChangeRenameValue(v: string) {
		this.rename_value = v
	}

	onCancelRename() {
		this.rename_project_id = ''
		this.rename_session_id = ''
		this.rename_value = ''
	}

	async onToggleAddModal() {
		this.add_modal_open = !this.add_modal_open

		const home_dir = await rpc.file.homedir.query()

		if (this.add_modal_open) await this.modal_files.init(home_dir)
	}

	async setFilesProjectId(v: string) {
		this.files_project_id = v
		this.side_panel_open = true

		await this.project_files.init(v)
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

		const from_index = this.expand_project_ids.findIndex(item => this.projects[from].project.id)

		this.expand_project_ids.splice(from_index, 1)

		const to_index = this.expand_project_ids.findIndex(item => this.projects[to].project.id)

		this.expand_project_ids.splice(to_index, 1)

		if (to < 0 || to > this.projects.length - 1) return

		this.projects = arrayMove(this.projects, from, to)

		await rpc.project.sort.mutate({ from, to })

		await this.getProjectList()
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
			this.selected_session_id = ''
		}

		await rpc.project.remove.mutate({ id: project_item.id })

		await this.getProjectList()
	}

	async createSession(project_id: string) {
		const res = await rpc.session.create.mutate({ project_id })

		await this.getProjectList()

		this.selected_session_id = res!.id
	}

	async renameSession() {
		if (!this.rename_value) return this.onCancelRename()

		await rpc.session.rename.mutate({ id: this.rename_session_id, title: this.rename_value })

		this.onCancelRename()

		await this.getProjectList()
	}

	async removeSession(session_id: string) {
		await rpc.session.remove.mutate({ id: session_id })

		await this.getProjectList()
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
								is_runing: status.running,
								unread: status.unread
							}
						}

						return session_item
					})
				}))
			}
		})

		this.util.acts.push(deinit.unsubscribe)
	}

	deinit() {
		this.util.deinit()
	}
}
