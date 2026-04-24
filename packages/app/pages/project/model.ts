import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

import { rpc } from '@/utils'

import type { FileTree, FileTreeDirectoryHandle, FileTreeItemHandle } from '@pierre/trees'
import type {
	IFileListItem,
	IProjectSerializedProjectItem,
	IProjectSerializedSessionItem,
	IProjectSerializedTodoItem,
	IProjectTreeItem
} from './types'

@injectable()
export default class Index {
	home_dir = ''
	projects = [] as Array<IProjectSerializedProjectItem>
	sessions = {} as Record<string, Array<IProjectSerializedSessionItem>>
	todos = {} as Record<string, Array<IProjectSerializedTodoItem>>
	file_trees = {} as Record<string, Array<IProjectTreeItem>>
	file_contents = {} as Record<string, string>
	directory_cache = {} as Record<string, Array<IFileListItem>>
	directory_loading_map = {} as Record<string, boolean>
	directory_loaded_map = {} as Record<string, boolean>
	file_tree_model = null as null | FileTree
	file_tree_syncing = false
	selected_project_id = ''
	selected_session_id = ''
	selected_file_path = ''
	selected_file_content = ''
	loading_project_id = ''
	has_more_map = {} as Record<string, boolean>
	expanded_project_map = {} as Record<string, boolean>

	constructor() {
		makeAutoObservable(this, { file_tree_model: false, file_tree_syncing: false }, { autoBind: true })
	}

	async init() {
		await this.refresh()

		this.home_dir = await rpc.file.homedir.query()

		await this.ensureHomeDirTree()
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

	async ensureHomeDirTree() {
		if (!this.home_dir) return

		await this.loadDirectory(this.home_dir)
	}

	setFileTreeModel(model: FileTree | null) {
		this.file_tree_model = model

		this.syncFileTreeModel()
	}

	getDirectoryPath(path: string) {
		if (!path) return ''

		return path.endsWith('/') ? path : `${path}/`
	}

	getTreePaths() {
		const path_set = new Set<string>()

		if (this.home_dir) {
			path_set.add(this.getDirectoryPath(this.home_dir))
		}

		for (const list of Object.values(this.directory_cache)) {
			for (const item of list) {
				path_set.add(item.dir)
			}
		}

		return [...path_set]
	}

	getExpandedDirectoryPaths() {
		if (!this.file_tree_model) return [] as Array<string>

		return this.getTreePaths().filter(path => {
			const tree_item = this.file_tree_model?.getItem(path) as FileTreeItemHandle | null

			if (!tree_item || !tree_item.isDirectory()) return false

			return (tree_item as FileTreeDirectoryHandle).isExpanded()
		})
	}

	syncFileTreeModel() {
		if (this.file_tree_syncing) return
		if (!this.file_tree_model) return

		this.file_tree_syncing = true

		try {
			this.file_tree_model.resetPaths(this.getTreePaths(), {
				initialExpandedPaths: this.getExpandedDirectoryPaths()
			})
		} finally {
			this.file_tree_syncing = false
		}
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

	handleTreeSelection(selected_path: string) {
		if (!selected_path) return

		const tree_item = this.file_tree_model?.getItem(selected_path)

		if (tree_item && tree_item.isDirectory()) {
			void this.loadDirectory(selected_path)
			this.selected_file_path = ''
			this.selected_file_content = ''

			return
		}

		this.setSelectedFilePath(selected_path)
	}

	async loadDirectory(target_path: string) {
		if (!target_path) return
		if (this.directory_loaded_map[target_path]) return
		if (this.directory_loading_map[target_path]) return

		this.directory_loading_map[target_path] = true

		try {
			const list = await rpc.file.list.query({ path: target_path })

			this.directory_cache[target_path] = list
			this.directory_loaded_map[target_path] = true
			this.syncFileTreeModel()

			return list
		} finally {
			this.directory_loading_map[target_path] = false
		}
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
