import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

import { rpc } from '@/utils'

import type {
	IFileListItem,
	IHomeDir,
	IProjectSerializedProjectItem,
	IProjectSerializedSessionItem,
	IProjectSerializedTodoItem,
	IProjectTreeItem
} from './types'

type IProjectDirectoryLoadMode = 'append' | 'replace'

@injectable()
export default class Index {
	projects = [] as Array<IProjectSerializedProjectItem>
	sessions = {} as Record<string, Array<IProjectSerializedSessionItem>>
	todos = {} as Record<string, Array<IProjectSerializedTodoItem>>
	file_trees = {} as Record<string, Array<IProjectTreeItem>>
	file_contents = {} as Record<string, string>
	selected_project_id = ''
	selected_session_id = ''
	selected_file_path = ''
	selected_file_content = ''
	project_directory_tree_paths = [] as Array<string>
	project_directory_loaded_path_map = {} as Record<string, boolean>
	project_home_dir = '' as IHomeDir
	project_directory_skip_next_replace = false
	loading_project_id = ''
	has_more_map = {} as Record<string, boolean>
	expanded_project_map = {} as Record<string, boolean>

	constructor() {
		makeAutoObservable(this, {}, { autoBind: true })
	}

	async init() {
		await this.refresh()
	}

	async refresh() {
		const previous_selected_project_id = this.selected_project_id
		const previous_selected_session_id = this.selected_session_id
		const previous_selected_file_path = this.selected_file_path

		const data = await rpc.project.getList.query()

		this.projects = data.projects
		this.sessions = data.sessions
		this.todos = data.todos
		this.file_trees = data.file_trees
		this.file_contents = data.file_contents

		const project_id_list = this.projects.map(item => item.id)
		const next_selected_project_id = project_id_list.includes(previous_selected_project_id)
			? previous_selected_project_id
			: data.selected_project_id || this.selected_project_id || ''

		this.selected_project_id = next_selected_project_id

		const selected_sessions = this.sessions[next_selected_project_id] || []
		const selected_session_exists = selected_sessions.some(item => item.id === previous_selected_session_id)

		this.selected_session_id = selected_session_exists
			? previous_selected_session_id
			: selected_sessions[0]?.id || ''

		const selected_files = this.file_trees[next_selected_project_id] || []
		const selected_file_exists = selected_files.some(item => item.dir === previous_selected_file_path)

		this.selected_file_path = selected_file_exists ? previous_selected_file_path : selected_files[0]?.dir || ''
		this.selected_file_content = this.file_contents[this.selected_file_path] || ''
		this.has_more_map = data.has_more_map
		this.expanded_project_map = Object.fromEntries(this.projects.map(item => [item.id, true]))
	}

	setSelectedProject(id: string) {
		this.selected_project_id = id
		this.expanded_project_map[id] = true

		const next_session_item = this.sessions[id]?.[0]
		this.selected_session_id = next_session_item?.id || ''

		const next_file_item = this.file_trees[id]?.find(item => item.file_type === 'file')
		this.setSelectedFilePath(next_file_item?.dir || '')
	}

	toggleProject(id: string) {
		this.expanded_project_map[id] = !this.expanded_project_map[id]
	}

	setSelectedSession(id: string) {
		this.selected_session_id = id
	}

	setSelectedFilePath(path: string) {
		this.selected_file_path = path
		this.selected_file_content = this.file_contents[path] || ''
	}

	setProjectDirectorySkipNextReplace(value: boolean) {
		this.project_directory_skip_next_replace = value
	}

	consumeProjectDirectorySkipNextReplace() {
		if (!this.project_directory_skip_next_replace) return false

		this.project_directory_skip_next_replace = false

		return true
	}

	getProjectDirectoryInputPath(target_path: string) {
		if (target_path === '/') return target_path

		return target_path.endsWith('/') ? target_path.slice(0, -1) : target_path
	}

	async getProjectHomeDir() {
		if (this.project_home_dir) return this.project_home_dir

		this.project_home_dir = await rpc.file.homedir.query()

		return this.project_home_dir
	}

	async ensureProjectDirectoryReady(args: { value: string; only_dir?: boolean }) {
		const { value, only_dir = false } = args
		const value_text = value.trim()
		const target_path = value_text || (await this.getProjectHomeDir())

		await this.loadProjectDirectory({ target_path, mode: 'replace', only_dir })

		return target_path
	}

	async loadProjectDirectory(args: { target_path: string; mode: IProjectDirectoryLoadMode; only_dir?: boolean }) {
		const { target_path, mode, only_dir = false } = args
		const next_path = target_path.trim()

		if (!next_path) {
			if (mode === 'replace') {
				this.project_directory_tree_paths = []
				this.project_directory_loaded_path_map = {}
			}

			return
		}

		if (mode === 'append' && this.project_directory_loaded_path_map[next_path]) return

		const list = (await rpc.file.list.query({ path: next_path, only_dir })) as Array<IFileListItem>
		const next_paths = list.map(item => item.dir)
		const current_paths = mode === 'replace' ? [] : this.project_directory_tree_paths
		const current_loaded_path_map = mode === 'replace' ? {} : this.project_directory_loaded_path_map

		this.project_directory_tree_paths = Array.from(new Set([...current_paths, ...next_paths]))
		this.project_directory_loaded_path_map = { ...current_loaded_path_map, [next_path]: true }
	}

	async createProject(args: { name: string; dir: string }) {
		const project_item = await rpc.project.create.mutate(args)

		await this.refresh()

		if (project_item?.id) {
			this.setSelectedProject(project_item.id)
		}
	}

	async removeProject(id: string) {
		await rpc.project.remove.mutate({ id })

		if (this.selected_project_id === id) {
			this.selected_project_id = ''
			this.selected_session_id = ''
			this.selected_file_path = ''
			this.selected_file_content = ''
		}

		await this.refresh()
	}

	async renameProject(args: { id: string; name: string }) {
		await rpc.project.rename.mutate(args)

		await this.refresh()
	}

	async sortProject(args: { from: number; to: number }) {
		await rpc.project.sort.mutate(args)

		await this.refresh()
	}

	async createSession(args: { project_id: string; title?: string }) {
		await rpc.session.create.mutate(args)

		await this.refresh()
	}

	async removeSession(args: { project_id: string; session_id: string }) {
		await rpc.session.remove.mutate({ id: args.session_id })

		await this.refresh()
	}

	async renameSession(args: { project_id: string; session_id: string; title: string }) {
		await rpc.session.rename.mutate({ id: args.session_id, title: args.title })

		await this.refresh()
	}

	async loadMoreSessions(project_id: string) {
		if (this.loading_project_id) return

		this.loading_project_id = project_id

		try {
			const current_count = this.sessions[project_id]?.length || 0
			const page = Math.max(1, Math.floor(current_count / 10) + 1)
			const res = await rpc.project.getMoreSessions.query({ project_id, page })

			this.sessions[project_id] = [...(this.sessions[project_id] || []), ...res.sessions]
			this.has_more_map[project_id] = res.has_more
		} finally {
			this.loading_project_id = ''
		}
	}

	async createTodo(args: { project_id: string; title: string }) {
		await rpc.project.createTodo.mutate(args)

		await this.refresh()
	}

	async removeTodo(args: { project_id: string; todo_id: string }) {
		await rpc.project.removeTodo.mutate(args)

		await this.refresh()
	}

	async renameTodo(args: { project_id: string; todo_id: string; title: string }) {
		await rpc.project.renameTodo.mutate(args)

		await this.refresh()
	}

	async loadFile(project_id: string, file_path: string) {
		const res = await rpc.project.getFileDetail.query({ project_id, file_path })

		this.selected_file_path = file_path
		this.selected_file_content = res.content
	}

	deinit() {}
}
