import { getTodoStatusOrder, todo_status_list } from '@core/consts/db'
import { getProjectTodo, getStandaloneTodos, setTodo } from '@core/db/services'
import { p } from '@core/utils'
import { asc, eq } from 'drizzle-orm'
import { object, string } from 'zod'

import { project_todo, todo } from '../../db/schema'

const status_list = todo_status_list

type TodoStatus = (typeof status_list)[number]

const input_type = object({
	active_id: string(),
	over_id: string().optional(),
	active_status: string(),
	over_status: string(),
	project_id: string().optional()
})

const status_order = getTodoStatusOrder(todo.status)

const getTodoList = async (project_id?: string) => {
	if (!project_id) {
		const rows = await getStandaloneTodos()
		return rows.map(item => item.todo)
	}

	const rows = await getProjectTodo({
		where: eq(project_todo.project_id, project_id),
		orderBy: [status_order, asc(todo.order), asc(todo.created_at)]
	})

	return rows.map(item => item.todo)
}

const getStatusInsertIndex = (args: { todos: Array<typeof todo.$inferSelect>; status: TodoStatus }) => {
	const { todos, status } = args

	return todos.reduce((target_index, item, index) => {
		if (item.status !== status) {
			return target_index
		}

		return index + 1
	}, 0)
}

export default p.input(input_type).mutation(async ({ input }) => {
	const todos = await getTodoList(input.project_id)
	const active_todo = todos.find(item => item.id === input.active_id)!
	const over_todo = todos.find(item => item.id === input.over_id)!
	const active_status = input.active_status ?? active_todo.status
	const over_status = input.over_status ?? over_todo?.status

	const remaining_todos = todos.filter(item => item.id !== input.active_id)
	active_todo.status = over_status

	const over_index = remaining_todos.findIndex(item => item.id === input.over_id)

	const target_index =
		over_index < 0
			? getStatusInsertIndex({ todos: remaining_todos, status: over_status as TodoStatus })
			: over_index
	remaining_todos.splice(target_index, 0, active_todo)

	const next_todos = status_list.flatMap(status => remaining_todos.filter(item => item.status === status))

	await Promise.all(
		next_todos.map((item, index) =>
			setTodo(eq(todo.id, item.id), {
				order: index,
				status: item.status
			})
		)
	)

	return next_todos
})
