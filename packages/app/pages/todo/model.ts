import { makeAutoObservable } from 'mobx'
import { setStorageWhenChange } from 'stk/mobx'
import { injectable } from 'tsyringe'

import { Util } from '@/models/common'
import { rpc } from '@/utils'

import type { RPCInput, RPCOutput } from '@/types'
import type { ITodoDetailForm, TodoItem, TodoStatus } from './types'

type TodoGroup = RPCOutput['todo']['query']
type TodoUpdateInput = RPCInput['todo']['update']

const createDetailForm = (todo_item?: TodoItem | null): ITodoDetailForm => ({
	title: todo_item?.title ?? '',
	description: todo_item?.description ?? '',
	status: todo_item?.status ?? 'draft',
	priority: todo_item?.priority ?? 'none',
	estimate: todo_item?.estimate ?? '',
	due_at: todo_item?.due_at ? new Date(todo_item.due_at).toISOString().slice(0, 10) : ''
})

const createDetailUpdateInput = (args: { todo_item: TodoItem; values: ITodoDetailForm }) => {
	const { todo_item, values } = args
	const payload: TodoUpdateInput = { id: todo_item.id }
	const next_title = values.title.trim()
	const next_description = values.description
	const next_status = values.status
	const next_priority = values.priority
	const next_estimate = values.estimate === '' ? null : values.estimate
	const next_due_at = values.due_at ? new Date(values.due_at).getTime() : null
	const current_due_at = todo_item.due_at ?? null

	if (next_title !== todo_item.title) {
		payload.title = next_title
	}

	if (next_description !== (todo_item.description ?? '')) {
		payload.description = next_description
	}

	if (next_status !== todo_item.status) {
		payload.status = next_status
	}

	if (next_priority !== todo_item.priority) {
		payload.priority = next_priority
	}

	if (next_estimate !== (todo_item.estimate ?? null)) {
		payload.estimate = next_estimate
	}

	if (next_due_at !== current_due_at) {
		payload.due_at = next_due_at
	}

	return payload
}

@injectable()
export default class Index {
	type = 'inbox'
	menu_data = {} as RPCOutput['todo']['getMenuData']
	kanban_data = {} as TodoGroup
	selected_todo_id = ''
	title_editing_todo_id = ''
	title_editing_value = ''
	detail_form = createDetailForm()
	detail_form_version = 0
	is_saving_detail = false

	constructor(public util: Util) {
		makeAutoObservable(this, { util: false }, { autoBind: true })
	}

	get selected_todo() {
		return this.findTodoById(this.selected_todo_id)
	}

	init() {
		const deinit = setStorageWhenChange([], this)

		this.util.acts = [deinit]

		this.getProjects()
		this.getTodos()
	}

	setType(v: string) {
		this.type = v
		this.selected_todo_id = ''
		this.title_editing_todo_id = ''
		this.title_editing_value = ''
		this.detail_form = createDetailForm()
		this.detail_form_version += 1

		this.getTodos()
	}

	selectTodo(todo_id: string) {
		if (this.selected_todo_id === todo_id) return

		this.selected_todo_id = todo_id
		this.syncDetailFormById(todo_id)
	}

	closeTodoDetail() {
		this.selected_todo_id = ''
		this.detail_form = createDetailForm()
		this.detail_form_version += 1
	}

	startEditTitle(todo_item: TodoItem) {
		this.title_editing_todo_id = todo_item.id
		this.title_editing_value = todo_item.title
	}

	setTitleEditingValue(value: string) {
		this.title_editing_value = value
	}

	cancelEditTitle() {
		this.title_editing_todo_id = ''
		this.title_editing_value = ''
	}

	async submitEditTitle(todo_id: string) {
		if (this.title_editing_todo_id !== todo_id) return

		const title = this.title_editing_value.trim()
		const current_todo = this.findTodoById(todo_id)

		if (!current_todo) {
			this.cancelEditTitle()

			return
		}

		if (!title || title === current_todo.title) {
			this.cancelEditTitle()

			return
		}

		await this.updateTodo({ id: todo_id, title })
		this.cancelEditTitle()
	}

	setDetailForm(values: ITodoDetailForm) {
		this.detail_form = values
	}

	async submitDetailForm(values: ITodoDetailForm) {
		if (!this.selected_todo_id) return

		const current_todo = this.findTodoById(this.selected_todo_id)

		if (!current_todo) return

		const next_title = values.title.trim()

		if (!next_title) return

		const next_input = createDetailUpdateInput({ todo_item: current_todo, values })

		if (Object.keys(next_input).length === 1) return

		this.is_saving_detail = true

		try {
			await this.updateTodo(next_input)
		} finally {
			this.is_saving_detail = false
		}
	}

	async getProjects() {
		this.menu_data = await rpc.todo.getMenuData.query()
	}

	async getTodos() {
		this.kanban_data = await rpc.todo.query.query({ type: this.type })

		if (!this.selected_todo_id) return

		const current_todo = this.findTodoById(this.selected_todo_id)

		if (!current_todo) {
			this.closeTodoDetail()

			return
		}

		this.syncDetailForm(current_todo)
	}

	deinit() {
		this.util.deinit()
	}

	private syncDetailFormById(todo_id: string) {
		this.syncDetailForm(this.findTodoById(todo_id))
	}

	private syncDetailForm(todo_item?: TodoItem | null) {
		this.detail_form = createDetailForm(todo_item)
		this.detail_form_version += 1
	}

	private findTodoById(todo_id: string) {
		for (const key of Object.keys(this.kanban_data) as Array<TodoStatus>) {
			const matched_todo = this.kanban_data[key]?.find(item => item.id === todo_id)

			if (matched_todo) {
				return matched_todo
			}
		}

		return null
	}

	private getTodoStatusById(todo_id: string) {
		for (const key of Object.keys(this.kanban_data) as Array<TodoStatus>) {
			if (this.kanban_data[key]?.some(item => item.id === todo_id)) {
				return key
			}
		}

		return null
	}

	private async updateTodo(input: TodoUpdateInput) {
		const updated_todo = await rpc.todo.update.mutate(input)

		if (!updated_todo) return

		this.applyUpdatedTodo(updated_todo)

		if (this.selected_todo_id === updated_todo.id) {
			this.syncDetailForm(updated_todo)
		}
	}

	private applyUpdatedTodo(updated_todo: TodoItem) {
		const previous_status = this.getTodoStatusById(updated_todo.id)
		const next_status = updated_todo.status

		if (!previous_status) return

		const previous_list = this.kanban_data[previous_status] ?? []
		const todo_index = previous_list.findIndex(item => item.id === updated_todo.id)

		if (todo_index === -1) return

		if (previous_status === next_status) {
			const next_list = [...previous_list]
			next_list[todo_index] = updated_todo

			this.kanban_data = {
				...this.kanban_data,
				[previous_status]: next_list
			}

			return
		}

		const next_previous_list = previous_list.filter(item => item.id !== updated_todo.id)
		const next_target_list = [...(this.kanban_data[next_status] ?? []), updated_todo]

		this.kanban_data = {
			...this.kanban_data,
			[previous_status]: next_previous_list,
			[next_status]: next_target_list
		}
	}
}
