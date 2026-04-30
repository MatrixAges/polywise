import { Archive, CheckCircle, Circle, Clock, FileText, XCircle } from 'lucide-react'
import { makeAutoObservable, runInAction } from 'mobx'
import { injectable } from 'tsyringe'

import { rpc } from '@/utils'

import type { Project, Todo } from '@core/db'
import type { IFilterType, IStatusConfig } from './types'

@injectable()
export default class Index {
	selected_filter: IFilterType = 'all'
	selected_project_id = ''
	standalone_todos: Array<Todo> = []
	project_todos_map = new Map<string, Array<Todo>>()
	projects: Array<Project> = []
	initialized = false
	selected_todo_id: string | null = null
	expanded_statuses = new Set<string>(['draft', 'pending', 'processing', 'done', 'error', 'archive'])
	detail_panel_open = false

	constructor() {
		makeAutoObservable(this, {}, { autoBind: true })
	}

	async init() {
		await this.loadData()
		runInAction(() => {
			this.initialized = true
		})
	}

	async loadData() {
		await Promise.all([this.getStandaloneTodos(), this.getProjectTodos(), this.getProjects()])
	}

	async getStandaloneTodos() {
		const data = await rpc.todo.query.query()

		runInAction(() => {
			this.standalone_todos = data as Array<Todo>
		})
	}

	async getProjectTodos() {
		const data = await rpc.todo.query.query({ is_project: true })

		runInAction(() => {
			this.project_todos_map = new Map()

			if (Array.isArray(data)) {
				for (const item of data) {
					const project_data = item as { project: Project; todos: Array<Todo> }

					this.project_todos_map.set(project_data.project.id, project_data.todos)
				}
			}
		})
	}

	async getProjects() {
		const data = await rpc.project.getList.query()

		runInAction(() => {
			this.projects = data.map(item => item.project)
		})
	}

	setFilter(filter: IFilterType) {
		this.selected_filter = filter
	}

	setSelectedProject(project_id: string) {
		this.selected_project_id = project_id
		this.selected_filter = 'project'
	}

	get current_todos(): Array<Todo> {
		if (this.selected_filter === 'all') {
			return this.standalone_todos
		}

		return this.project_todos_map.get(this.selected_project_id) || []
	}

	get current_title(): string {
		if (this.selected_filter === 'all') {
			return 'All'
		}

		const project = this.projects.find(p => p.id === this.selected_project_id)

		return project?.name || 'Project'
	}

	get status_configs(): Array<IStatusConfig> {
		return [
			{ key: 'draft', label: 'Draft', icon: FileText, color: 'text-std-400' },
			{ key: 'pending', label: 'Todo', icon: Circle, color: 'text-blue-500' },
			{ key: 'processing', label: 'In Progress', icon: Clock, color: 'text-yellow-500' },
			{ key: 'done', label: 'Done', icon: CheckCircle, color: 'text-green-500' },
			{ key: 'error', label: 'Cancelled', icon: XCircle, color: 'text-red-500' },
			{ key: 'archive', label: 'Archive', icon: Archive, color: 'text-std-300' }
		]
	}

	get grouped_todos(): Map<string, Array<Todo>> {
		const grouped = new Map<string, Array<Todo>>()

		for (const config of this.status_configs) {
			grouped.set(config.key, [])
		}

		for (const todo of this.current_todos) {
			const group = grouped.get(todo.status)

			if (group) {
				group.push(todo)
			}
		}

		return grouped
	}

	get selected_todo(): Todo | null {
		if (!this.selected_todo_id) return null

		return this.current_todos.find(t => t.id === this.selected_todo_id) || null
	}

	selectTodo(id: string) {
		this.selected_todo_id = id
		this.detail_panel_open = true
	}

	toggleStatusGroup(status: string) {
		if (this.expanded_statuses.has(status)) {
			this.expanded_statuses.delete(status)
		} else {
			this.expanded_statuses.add(status)
		}
	}

	toggleDetailPanel() {
		this.detail_panel_open = !this.detail_panel_open

		if (!this.detail_panel_open) {
			this.selected_todo_id = null
		}
	}

	closeDetailPanel() {
		this.detail_panel_open = false
		this.selected_todo_id = null
	}

	async createTodo(title: string) {
		if (!title.trim()) return

		const project_id = this.selected_filter === 'project' ? this.selected_project_id : undefined

		await rpc.todo.create.mutate({ title, project_id })
		await this.loadData()
	}

	async updateTodo(id: string, values: Partial<Todo>) {
		await rpc.todo.update.mutate({ id, ...values })
		await this.loadData()
	}

	async updateTodoField(id: string, field: string, value: unknown) {
		await this.updateTodo(id, { [field]: value })
	}

	async removeTodo(id: string) {
		await rpc.todo.remove.mutate({ id })
		await this.loadData()

		if (this.selected_todo_id === id) {
			this.closeDetailPanel()
		}
	}

	deinit() {}
}
