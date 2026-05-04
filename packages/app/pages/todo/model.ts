import { makeAutoObservable, runInAction } from 'mobx'
import { setStorageWhenChange } from 'stk/mobx'
import { injectable } from 'tsyringe'

import { Util } from '@/models/common'
import { rpc } from '@/utils'

import type { RPCInput, RPCOutput } from '@/types'
import type { Todo } from '@core/db'
import type { DragEndEvent } from '@dnd-kit/core'

interface IArgsMoveTodoLocal {
	active_id: string
	from_status: string
	over_id?: string
	over_status: string
}

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

	onDragStartTodo() {
		this.selected_todo_id = ''
		this.detail_todo = null as unknown as Todo
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

	async onDragTodo(args: DragEndEvent) {
		const { active, over } = args

		if (!over?.id || active.id === over.id) {
			return
		}

		const active_status = active.data.current?.status

		if (typeof active_status !== 'string') {
			return
		}

		const over_status =
			typeof over.data.current?.status === 'string'
				? over.data.current.status
				: this.getTodoStatusById(String(over.id))

		if (!over_status) {
			return
		}

		const snapshot_data = $copy(this.kanban_data)

		this.moveTodoLocal({
			active_id: String(active.id),
			from_status: active_status,
			over_id: String(over.id),
			over_status
		})

		const to_index = this.kanban_data[over_status].findIndex(item => item.id === active.id)

		if (to_index < 0) {
			this.kanban_data = snapshot_data

			return
		}

		try {
			await rpc.todo.sort.mutate({
				todo_id: String(active.id),
				to_status: over_status,
				to_index,
				project_id: this.type === 'inbox' ? undefined : this.type
			})

			await this.getTodos()
		} catch {
			runInAction(() => {
				this.kanban_data = snapshot_data
			})

			await this.getTodos()
		}
	}

	getTodoStatusById(todo_id: string) {
		for (const status of Object.keys(this.kanban_data)) {
			if (this.kanban_data[status].some(item => item.id === todo_id)) {
				return status
			}
		}

		return ''
	}

	moveTodoLocal(args: IArgsMoveTodoLocal) {
		const { active_id, from_status, over_id, over_status } = args

		if (!from_status) {
			return
		}

		const source_todos = [...this.kanban_data[from_status]]
		const target_todos = from_status === over_status ? source_todos : [...this.kanban_data[over_status]]
		const from_index = source_todos.findIndex(item => item.id === active_id)

		if (from_index < 0) {
			return
		}

		const [active_todo] = source_todos.splice(from_index, 1)

		if (!active_todo) {
			return
		}

		const target_index = this.getTargetIndex({ from_status, over_id, over_status, target_todos })

		target_todos.splice(target_index, 0, {
			...active_todo,
			status: over_status
		})

		this.kanban_data = {
			...this.kanban_data,
			[from_status]: from_status === over_status ? target_todos : source_todos,
			[over_status]: target_todos
		}
	}

	getTargetIndex(args: {
		from_status: string
		over_id?: string
		over_status: string
		target_todos: Array<KanbanTodo>
	}) {
		const { from_status, over_id, over_status, target_todos } = args

		if (!over_id || over_id === `col:${over_status}`) {
			return target_todos.length
		}

		if (from_status === over_status) {
			const target_index = this.kanban_data[over_status].findIndex(item => item.id === over_id)

			return target_index < 0 ? target_todos.length : target_index
		}

		const target_index = target_todos.findIndex(item => item.id === over_id)

		return target_index < 0 ? target_todos.length : target_index
	}

	deinit() {
		this.util.deinit()
	}
}
