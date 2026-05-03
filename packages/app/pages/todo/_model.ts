import { Archive, CheckCircle, Circle, Clock, FileText, XCircle } from 'lucide-react'
import { makeAutoObservable, runInAction } from 'mobx'
import { injectable } from 'tsyringe'

import { rpc } from '@/utils'

import type { Project, Todo } from '@core/db'
import type { IFilterType, IPriorityConfig, IStatusConfig } from './types'

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
			return 'Inbox'
		}

		const project = this.projects.find(p => p.id === this.selected_project_id)

		return project?.name || 'Project'
	}

	get all_todo_count() {
		return this.standalone_todos.length
	}

	get status_configs(): Array<IStatusConfig> {
		return [
			{
				key: 'draft',
				label: 'Draft',
				icon: FileText,
				color: 'text-std-500',
				badge_class: 'bg-secondary text-foreground'
			},
			{
				key: 'pending',
				label: 'Todo',
				icon: Circle,
				color: 'text-sky-500',
				badge_class: 'bg-sky-500/10 text-sky-600 dark:text-sky-300'
			},
			{
				key: 'processing',
				label: 'In Progress',
				icon: Clock,
				color: 'text-amber-500',
				badge_class: 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
			},
			{
				key: 'done',
				label: 'Done',
				icon: CheckCircle,
				color: 'text-emerald-500',
				badge_class: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
			},
			{
				key: 'error',
				label: 'Cancelled',
				icon: XCircle,
				color: 'text-rose-500',
				badge_class: 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
			},
			{
				key: 'archive',
				label: 'Archive',
				icon: Archive,
				color: 'text-muted-foreground',
				badge_class: 'bg-muted text-muted-foreground'
			}
		]
	}

	get priority_configs(): Array<IPriorityConfig> {
		return [
			{ key: 'low', label: 'Low', badge_class: 'bg-sky-500/10 text-sky-600 dark:text-sky-300' },
			{
				key: 'medium',
				label: 'Medium',
				badge_class: 'bg-violet-500/10 text-violet-700 dark:text-violet-300'
			},
			{ key: 'high', label: 'High', badge_class: 'bg-orange-500/10 text-orange-700 dark:text-orange-300' },
			{ key: 'urgent', label: 'Urgent', badge_class: 'bg-rose-500/10 text-rose-700 dark:text-rose-300' }
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

	getProjectTodoCount(project_id: string) {
		return this.project_todos_map.get(project_id)?.length || 0
	}

	getStatusConfig(status: string) {
		return this.status_configs.find(item => item.key === status) || this.status_configs[0]
	}

	getPriorityConfig(priority: Todo['priority'] | null | undefined) {
		if (!priority) {
			return null
		}

		return this.priority_configs.find(item => item.key === priority) || null
	}

	formatDueAt(date: Date | string | null | undefined) {
		if (!date) {
			return null
		}

		return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(date))
	}

	formatEstimate(estimate: number | null | undefined) {
		if (estimate === null || estimate === undefined) {
			return null
		}

		if (estimate < 60) {
			return `${estimate}m`
		}

		const hours = Math.floor(estimate / 60)
		const minutes = estimate % 60

		if (minutes === 0) {
			return `${hours}h`
		}

		return `${hours}h ${minutes}m`
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
