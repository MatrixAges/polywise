import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

import { rpc } from '@/utils'

import type { DragEndEvent } from '@dnd-kit/core'
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
	project_directory_replace_timer = 0 as ReturnType<typeof setTimeout> | 0
	create_open = false
	rename_open = false
	delete_open = false
	project_name = ''
	project_dir = ''
	target_project_id = ''
	target_project_name = ''
	todo_input_value = ''
	todo_editing_id = ''
	todo_editing_value = ''
	loading_project_id = ''
	has_more_map = {} as Record<string, boolean>
	expanded_project_map = {} as Record<string, boolean>

	constructor() {
		makeAutoObservable(this, {}, { autoBind: true })
	}

	async init() {
		await this.refresh()
	}

	get selected_project_todos() {
		return this.todos[this.selected_project_id] || []
	}

	get selected_project_tree_paths() {
		const selected_project_items = this.file_trees[this.selected_project_id] || []

		return selected_project_items.map(item => item.dir)
	}

	get selected_file_patch() {
		if (!this.selected_file_path || !this.selected_file_content) {
			return ''
		}

		const file_path = this.selected_file_path
		const content = this.selected_file_content
		const lines = content.split('\n')

		return [
			`--- a/${file_path}`,
			`+++ b/${file_path}`,
			`@@ -0,0 +1,${lines.length} @@`,
			...lines.map(line => `+${line}`)
		].join('\n')
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

		if (next_selected_project_id) {
			await this.loadProjectRootDirectory(next_selected_project_id)
		}

		const selected_sessions = this.sessions[next_selected_project_id] || []
		const selected_session_exists = selected_sessions.some(item => item.id === previous_selected_session_id)

		this.selected_session_id = selected_session_exists
			? previous_selected_session_id
			: selected_sessions[0]?.id || ''

		const selected_files = (this.file_trees[next_selected_project_id] || []).filter(
			item => item.file_type === 'file'
		)
		const selected_file_exists = selected_files.some(item => item.dir === previous_selected_file_path)

		this.selected_file_path = selected_file_exists ? previous_selected_file_path : selected_files[0]?.dir || ''
		this.selected_file_content = this.file_contents[this.selected_file_path] || ''
		this.has_more_map = data.has_more_map
		this.expanded_project_map = Object.fromEntries(this.projects.map(item => [item.id, true]))

		const selected_todo_list = this.todos[next_selected_project_id] || []

		if (this.todo_editing_id && !selected_todo_list.some(item => item.id === this.todo_editing_id)) {
			this.cancelRenameTodo()
		}
	}

	setSelectedProject(id: string) {
		this.selected_project_id = id
		this.expanded_project_map[id] = true

		const next_session_item = this.sessions[id]?.[0]
		this.selected_session_id = next_session_item?.id || ''

		this.setSelectedFilePath('')
		this.loadProjectRootDirectory(id)
		this.cancelRenameTodo()
	}

	setProjectName(value: string) {
		this.project_name = value
	}

	setProjectDir(value: string) {
		this.project_dir = value
		this.scheduleReplaceProjectDirectoryByInput()
	}

	async ensureCreateProjectDirectoryReady() {
		if (!this.create_open) return

		const next_path = await this.ensureProjectDirectoryReady({
			value: this.project_dir,
			only_dir: true
		})

		if (!this.project_dir.trim()) {
			this.project_dir = next_path
		}
	}

	async replaceProjectDirectoryByInput() {
		if (!this.create_open) return

		if (this.consumeProjectDirectorySkipNextReplace()) {
			return
		}

		await this.loadProjectDirectory({
			target_path: this.project_dir,
			mode: 'replace',
			only_dir: true
		})
	}

	onSelectProjectDirectoryPath(selected_path: string) {
		const next_path = this.getProjectDirectoryInputPath(selected_path)

		this.setProjectDirectorySkipNextReplace(true)
		this.project_dir = next_path
		this.loadProjectDirectory({ target_path: next_path, mode: 'append', only_dir: true })
	}

	scheduleReplaceProjectDirectoryByInput() {
		if (!this.create_open) return

		this.clearProjectDirectoryReplaceTimer()

		this.project_directory_replace_timer = setTimeout(() => {
			this.replaceProjectDirectoryByInput()
		}, 300)
	}

	clearProjectDirectoryReplaceTimer() {
		if (!this.project_directory_replace_timer) return

		clearTimeout(this.project_directory_replace_timer)
		this.project_directory_replace_timer = 0
	}

	openCreateProjectDialog() {
		this.target_project_id = ''
		this.target_project_name = ''
		this.project_name = ''
		this.create_open = true
		this.project_dir = ''

		this.ensureCreateProjectDirectoryReady()
	}

	openRenameProjectDialog(project_item: IProjectSerializedProjectItem) {
		this.target_project_id = project_item.id
		this.target_project_name = project_item.name
		this.project_name = project_item.name
		this.project_dir = project_item.dir
		this.rename_open = true
	}

	openDeleteProjectDialog(project_item: IProjectSerializedProjectItem) {
		this.target_project_id = project_item.id
		this.target_project_name = project_item.name
		this.delete_open = true
	}

	closeCreateDialog() {
		this.create_open = false
		this.clearProjectDirectoryReplaceTimer()
	}

	closeRenameDialog() {
		this.rename_open = false
	}

	closeDeleteDialog() {
		this.delete_open = false
	}

	getProjectNameFromDir(dir: string) {
		const dir_text = dir.trim()
		const segments = dir_text.split(/[\\/]/).filter(Boolean)

		return segments[segments.length - 1] || dir_text || 'Project'
	}

	async submitCreateProject() {
		const next_dir = this.project_dir.trim()
		const next_name = this.getProjectNameFromDir(next_dir)

		if (!next_name || !next_dir) return

		await this.createProject({ name: next_name, dir: next_dir })

		this.create_open = false
		this.clearProjectDirectoryReplaceTimer()
	}

	async submitRenameProject() {
		const project_id = this.target_project_id
		const next_name = this.project_name.trim()

		if (!project_id || !next_name) return

		await this.renameProject({ id: project_id, name: next_name })

		this.rename_open = false
	}

	async confirmRemoveProject() {
		const project_id = this.target_project_id

		if (!project_id) return

		await this.removeProject(project_id)

		this.delete_open = false
	}

	async onProjectDragEnd(args: DragEndEvent) {
		const { active, over } = args

		if (!over?.id || active.id === over.id) {
			return
		}

		const from = this.projects.findIndex(item => item.id === active.id)
		const to = this.projects.findIndex(item => item.id === over.id)

		if (from < 0 || to < 0) {
			return
		}

		await this.sortProject({ from, to })
	}

	setTodoInputValue(value: string) {
		this.todo_input_value = value
	}

	startRenameTodo(args: { todo_id: string; title: string }) {
		const { todo_id, title } = args

		this.todo_editing_id = todo_id
		this.todo_editing_value = title
	}

	setTodoEditingValue(value: string) {
		this.todo_editing_value = value
	}

	cancelRenameTodo() {
		this.todo_editing_id = ''
		this.todo_editing_value = ''
	}

	async createTodoFromInput() {
		const project_id = this.selected_project_id
		const title = this.todo_input_value.trim()

		if (!project_id || !title) return

		await this.createTodo({ project_id, title })

		this.todo_input_value = ''
	}

	async submitRenameTodo(todo_id: string) {
		const project_id = this.selected_project_id
		const title = this.todo_editing_value.trim()

		if (!project_id || !title) return

		await this.renameTodo({ project_id, todo_id, title })

		this.cancelRenameTodo()
	}

	async removeTodoById(todo_id: string) {
		const project_id = this.selected_project_id

		if (!project_id) return

		await this.removeTodo({ project_id, todo_id })

		if (this.todo_editing_id === todo_id) {
			this.cancelRenameTodo()
		}
	}

	toggleProject(id: string) {
		this.expanded_project_map[id] = !this.expanded_project_map[id]
	}

	setSelectedSession(id: string) {
		this.selected_session_id = id
	}

	async setSelectedFilePath(path: string) {
		if (!path) {
			this.selected_file_path = ''
			this.selected_file_content = ''

			return
		}

		const project_id = this.selected_project_id
		const file_item = this.file_trees[project_id]?.find(item => item.dir === path)

		if (file_item?.file_type === 'directory') {
			await this.loadProjectFileDirectory({ project_id, target_path: path })

			return
		}

		if (file_item?.file_type !== 'file') return

		await this.loadFile(project_id, path)
	}

	getProjectById(project_id: string) {
		return this.projects.find(item => item.id === project_id)
	}

	mergeProjectTreeItems(args: { project_id: string; items: Array<IFileListItem> }) {
		const { project_id, items } = args
		const current_items = this.file_trees[project_id] || []
		const item_map = new Map(current_items.map(item => [item.dir, item]))

		for (const item of items) {
			item_map.set(item.dir, item)
		}

		this.file_trees[project_id] = Array.from(item_map.values())
	}

	async loadProjectRootDirectory(project_id: string) {
		if (this.file_trees[project_id]?.length) return

		const project_item = this.getProjectById(project_id)

		if (!project_item) return

		await this.loadProjectFileDirectory({ project_id, target_path: project_item.dir })
	}

	async loadProjectFileDirectory(args: { project_id: string; target_path: string }) {
		const { project_id, target_path } = args

		if (!project_id || !target_path) return

		const all_list = (await rpc.file.list.query({ path: target_path })) as Array<IFileListItem>

		this.mergeProjectTreeItems({ project_id, items: all_list })
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

	filterProjectDirectoryList(args: { list: Array<IFileListItem>; only_dir: boolean }) {
		const { list, only_dir } = args

		if (!only_dir) return list

		return list.filter(item => item.file_type === 'directory')
	}

	async ensureProjectDirectoryReady(args: { value: string; only_dir?: boolean }) {
		const { value, only_dir = false } = args
		const value_text = value.trim()

		if (!value_text) {
			const home_dir = await this.getProjectHomeDir()
			const all_list = (await rpc.file.list.query({ path: home_dir })) as Array<IFileListItem>
			const list = this.filterProjectDirectoryList({ list: all_list, only_dir })

			this.project_directory_tree_paths = list.map(item => item.dir)
			this.project_directory_loaded_path_map = { [home_dir]: true }

			return home_dir
		}

		await this.loadProjectDirectory({ target_path: value_text, mode: 'replace', only_dir })

		return value_text
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

		const all_list = (await rpc.file.list.query({ path: next_path })) as Array<IFileListItem>
		const list = this.filterProjectDirectoryList({ list: all_list, only_dir })
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

	deinit() {
		this.clearProjectDirectoryReplaceTimer()
	}
}
