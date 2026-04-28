import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

import { Util } from '@/models/common'
import { rpc } from '@/utils'

import type { Project, Session } from '@core/db'

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
	add_modal_select_path = ''
	add_modal_loaded_path_map = {} as Record<string, boolean>

	constructor(public util: Util) {
		makeAutoObservable(this, { add_modal_loaded_path_map: false }, { autoBind: true })
	}

	init() {
		this.getProjectList()
	}

	async getProjectList() {
		const data = (await rpc.project.getList.query()) as Index['projects']

		this.projects = data
	}

	setSelectedProject(project_id: string) {
		this.selected_project_id = project_id
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

	async getHomedirPaths() {
		const home_dir = await rpc.file.homedir.query()

		this.add_modal_select_path = home_dir

		await this.loadAddModalDirectory({ target_path: home_dir, mode: 'replace' })
	}

	async onSelectAddModalPath(v: { directory: boolean; path: string }) {
		if (!v.directory) return

		const target_path = this.getAddModalAbsolutePath(v.path)

		await this.loadAddModalDirectory({ target_path, mode: 'append' })
	}

	async loadAddModalDirectory(args: { target_path: string; mode: 'replace' | 'append' }) {
		const { target_path, mode } = args
		const next_path = target_path.trim()

		if (!next_path || !this.add_modal_select_path) return

		if (mode === 'append' && this.add_modal_loaded_path_map[next_path]) return

		const list = await rpc.file.list.query({ path: next_path, dir_only: true })
		const next_paths = list.map(item => this.getAddModalRelativePath(item.dir))
		const current_paths = mode === 'replace' ? [] : this.add_modal_paths
		const current_loaded_path_map = mode === 'replace' ? {} : this.add_modal_loaded_path_map

		this.add_modal_paths = Array.from(new Set([...current_paths, ...next_paths]))
		this.add_modal_loaded_path_map = { ...current_loaded_path_map, [next_path]: true }
	}

	getAddModalRelativePath(target_path: string) {
		if (!this.add_modal_select_path) return target_path

		const base_prefix = `${this.add_modal_select_path}/`

		if (target_path === this.add_modal_select_path) return ''

		return target_path.startsWith(base_prefix) ? target_path.replace(base_prefix, '') : target_path
	}

	getAddModalAbsolutePath(target_path: string) {
		if (!target_path) return this.add_modal_select_path

		return `${this.add_modal_select_path}/${target_path}`
	}

	async createProject() {}

	async renameProject(project_item: Project) {
		if (!this.rename_value) return this.onCancelRename()

		await rpc.project.rename.mutate({ id: project_item.id, name: this.rename_value })

		this.onCancelRename()

		await this.getProjectList()
	}

	async removeProject(project_item: Project) {}

	async createSession(project_id: string) {
		await rpc.session.create.mutate({ project_id })

		await this.getProjectList()
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

	deinit() {
		this.util.deinit()
	}
}
