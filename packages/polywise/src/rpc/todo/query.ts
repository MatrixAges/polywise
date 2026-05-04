import { getTodoStatusOrder, todo_status_list } from '@core/consts/db'
import { getProjectTodo, getStandaloneTodos } from '@core/db/services'
import { p } from '@core/utils'
import { asc, eq } from 'drizzle-orm'
import { object, string } from 'zod'

import { project_todo, todo } from '../../db/schema'

type TodoItem = Awaited<ReturnType<typeof getStandaloneTodos>>[number]['todo']
type TodoStatus = TodoItem['status']
type TodoGroup = Record<TodoStatus, Array<TodoItem>>

const input_type = object({
	type: string()
})

const status_order = getTodoStatusOrder(todo.status)

const createTodoGroup = () => {
	const grouped_todos = Object.fromEntries(todo_status_list.map(status => [status, []]))

	return grouped_todos as TodoGroup
}

const groupTodosByStatus = (todos: Array<TodoItem>) => {
	const grouped_todos = createTodoGroup()

	for (const todo_item of todos) {
		grouped_todos[todo_item.status].push(todo_item)
	}

	return grouped_todos
}

export default p.input(input_type).query(async ({ input }) => {
	if (input.type !== 'inbox') {
		const rows = await getProjectTodo({
			where: eq(project_todo.project_id, input.type),
			orderBy: [status_order, asc(todo.order), asc(todo.created_at)]
		})

		return groupTodosByStatus(rows.map(item => item.todo))
	}

	const rows = await getStandaloneTodos()

	return groupTodosByStatus(rows.map(item => item.todo))
})
