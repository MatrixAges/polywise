import { arrayMove } from '@dnd-kit/sortable'
import { makeAutoObservable } from 'mobx'
import { setStorageWhenChange } from 'stk/mobx'
import { injectable } from 'tsyringe'

import { Util } from '@/models/common'
import { rpc } from '@/utils'

import type { RPCInput, RPCOutput } from '@/types'
import type { Todo } from '@core/db'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'

type KanbanData = RPCOutput['todo']['query']
type KanbanStatus = keyof KanbanData
type KanbanTodo = KanbanData[KanbanStatus][number]

@injectable()
export default class Index {
	type = 'inbox'
	mode = 'kanban' as 'kanban' | 'list'
	menu_data = {} as RPCOutput['todo']['getMenuData']
	kanban_data = {} as KanbanData
	selected_todo_id = ''
	detail_todo = null as unknown as Todo
	drag_todo = null as KanbanTodo | null

	constructor(public util: Util) {
		makeAutoObservable(this, { util: false }, { autoBind: true })
	}

	init() {
		const deinit = setStorageWhenChange([{ todo_mode: 'mode' }], this)

		this.util.acts = [deinit]

		this.getProjects()
		this.getTodos()
	}

	setType(v: string) {
		this.type = v
		this.selected_todo_id = ''
		this.detail_todo = null as unknown as Todo

		this.getTodos()
	}

	toggleMode() {
		this.mode = this.mode === 'kanban' ? 'list' : 'kanban'
	}

	setSelectTodo(status: string, index: number) {
		const todo = this.kanban_data[status][index]! as Todo

		this.selected_todo_id = todo.id
		this.detail_todo = todo
	}

	closeTodoDetail() {
		this.selected_todo_id = ''
		this.detail_todo = null as unknown as Todo
	}

	onDragStart(args: DragStartEvent) {
		const { active } = args

		const active_status = active.data.current?.status
		const active_index = active.data.current?.index

		this.selected_todo_id = ''
		this.detail_todo = null as unknown as Todo
		this.drag_todo = this.kanban_data[active_status][active_index]
	}

	onDragCancel() {
		this.drag_todo = null
	}

	async getProjects() {
		this.menu_data = await rpc.todo.getMenuData.query()
	}

	async getTodos() {
		this.kanban_data = await rpc.todo.query.query({ type: this.type })
	}

	async updateTodo(v: RPCInput['todo']['update']) {
		await rpc.todo.update.mutate({ ...v, id: this.selected_todo_id })
	}

	async createTodo(v: string) {
		await rpc.todo.create.mutate({ title: v, project_id: this.type === 'inbox' ? undefined : this.type })

		await this.getTodos()
	}

	async onDragEnd(args: DragEndEvent) {
		const { active, over } = args

		this.drag_todo = null

		const active_status = active.data.current?.status
		const active_index = active.data.current?.index
		const over_status = over?.data.current?.status
		const over_index = over?.data.current?.index

		if (active.id === over?.id) return

		const active_todo = this.kanban_data[active_status][active_index]
		const over_todo = this.kanban_data[over_status][over_index]
		const project_id = this.type === 'inbox' ? undefined : this.type

		if (active_status === over_status) {
			if (!over_status || over_index === undefined) return

			this.kanban_data[active_status] = arrayMove(this.kanban_data[active_status], active_index, over_index)

			await rpc.todo.sort.mutate({
				from: active_index,
				to: over_index,
				project_id
			})
		} else {
			this.kanban_data[active_status].splice(active_index, 1)

			console.log(active_todo, over_todo, over)

			await rpc.todo.drag.mutate({
				active_id: active_todo.id,
				over_id: over_todo.id,
				active_status,
				over_status,
				project_id
			})
		}

		await this.getTodos()
	}

	deinit() {
		this.util.deinit()
	}
}
