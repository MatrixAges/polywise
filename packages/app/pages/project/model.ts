import { arrayMove } from '@dnd-kit/sortable'
import { makeAutoObservable } from 'mobx'
import { setStorageWhenChange } from 'stk/mobx'
import { injectable } from 'tsyringe'

import { Util } from '@/models/common'
import { alert, rpc } from '@/utils'

import type { Project, Session } from '@core/db'
import type { ChangeEvent } from 'react'

@injectable()
export default class Index {
	selected_project_id = ''
	selected_session_id = ''
	rename_project_id = ''
	rename_session_id = ''
	rename_value = ''
	projects = [] as Array<{ project: Project; sessions: Array<Session>; has_more: boolean }>
	add_modal_open = false
	add_modal_paths = [] as Array<string>
	add_modal_root_path = ''
	add_modal_input_path = ''
	add_modal_tree_version = 0
	add_modal_loaded_path_map = {} as Record<string, boolean>
	expand_project_ids = [] as Array<string>

	constructor(public util: Util) {
		makeAutoObservable(this, { add_modal_loaded_path_map: false }, { autoBind: true })
	}

	async init() {
		const deinit = setStorageWhenChange(
			[
				{ project_selected_project_id: 'selected_project_id' },
				{ project_selected_session_id: 'selected_session_id' },
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

	onToggleAddModal() {
		this.add_modal_open = !this.add_modal_open

		if (this.add_modal_open) this.getHomedirPaths()
	}

	onChangeAddModalPath(e: ChangeEvent<HTMLInputElement>) {
		const v = e.target.value

		this.add_modal_input_path = v
	}

	getAddModalRelativePath(target_path: string) {
		if (!this.add_modal_root_path) return target_path

		const base_prefix = this.add_modal_root_path.endsWith('/')
			? this.add_modal_root_path
			: `${this.add_modal_root_path}/`

		if (target_path === this.add_modal_root_path) return ''

		return target_path.startsWith(base_prefix) ? target_path.replace(base_prefix, '') : target_path
	}

	getAddModalAbsolutePath(target_path: string) {
		if (!target_path) return this.add_modal_root_path

		return `${this.add_modal_root_path}/${target_path}`
	}

	async getProjectList() {
		const data = (await rpc.project.getList.query()) as Index['projects']

		this.projects = data
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

	async getHomedirPaths() {
		const home_dir = await rpc.file.homedir.query()

		this.add_modal_root_path = home_dir
		this.add_modal_input_path = home_dir

		await this.loadAddModalDirectory({ target_path: home_dir, mode: 'replace' })
	}

	async onSelectAddModalPath(v: { directory: boolean; path: string }) {
		if (!v.directory) return

		const target_path = this.getAddModalAbsolutePath(v.path)

		await this.loadAddModalDirectory({ target_path, mode: 'append' })

		this.add_modal_input_path = target_path
	}

	async onFetchAddModalPath() {
		this.add_modal_paths = []
		this.add_modal_loaded_path_map = {}
		this.add_modal_tree_version += 1
		this.add_modal_root_path = this.add_modal_input_path

		await this.loadAddModalDirectory({ target_path: this.add_modal_input_path, mode: 'replace' })
	}

	async loadAddModalDirectory(args: { target_path: string; mode: 'replace' | 'append' }) {
		const { target_path, mode } = args
		const next_path = target_path.trim()

		if (!next_path || !this.add_modal_root_path) return

		if (mode === 'append' && this.add_modal_loaded_path_map[next_path]) return

		const list = await rpc.file.list.query({ path: next_path, dir_only: true })

		const next_paths = list.map(item => this.getAddModalRelativePath(item.dir))
		const current_paths = mode === 'replace' ? [] : this.add_modal_paths
		const current_loaded_path_map = mode === 'replace' ? {} : this.add_modal_loaded_path_map

		this.add_modal_paths = Array.from(new Set([...current_paths, ...next_paths]))
		this.add_modal_loaded_path_map = { ...current_loaded_path_map, [next_path]: true }
	}

	async createProject() {
		if (!this.add_modal_input_path) return

		this.add_modal_open = false

		await rpc.project.create.mutate({ dir: this.add_modal_input_path })

		await this.getProjectList()

		this.add_modal_paths = [] as Array<string>
		this.add_modal_root_path = ''
		this.add_modal_input_path = ''
		this.add_modal_tree_version = 0
		this.add_modal_loaded_path_map = {}
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
