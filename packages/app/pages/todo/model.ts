import { makeAutoObservable, runInAction } from 'mobx'
import { injectable } from 'tsyringe'

import { rpc } from '@/utils'

import type { Project, Todo } from '@core/db'
import type { IFilterType } from './types'

@injectable()
export default class Index {
	selected_filter: IFilterType = 'all'
	selected_project_id = ''
	standalone_todos: Array<Todo> = []
	project_todos_map = new Map<string, Array<Todo>>()
	projects: Array<Project> = []
	initialized = false

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

	async removeTodo(id: string) {
		await rpc.todo.remove.mutate({ id })
		await this.loadData()
	}

	deinit() {}
}
