import { getProjectTodo, getStandaloneTodos } from '@core/db/services'
import { p } from '@core/utils'
import { asc, eq, sql } from 'drizzle-orm'
import { boolean, object, string } from 'zod'

import { project_todo, todo } from '../../db/schema'

type TodoItem = Awaited<ReturnType<typeof getStandaloneTodos>>[number]['todo']
type TodoStatus = TodoItem['status']
type TodoGroup = Record<TodoStatus, Array<TodoItem>>

const input_type = object({
	type: string()
})

const status_order = sql`CASE ${todo.status} WHEN 'draft' THEN 0 WHEN 'pending' THEN 1 WHEN 'processing' THEN 2 WHEN 'unreview' THEN 3 WHEN 'done' THEN 4 WHEN 'error' THEN 5 WHEN 'archive' THEN 6 END`

const createTodoGroup = (): TodoGroup => ({
	draft: [],
	pending: [],
	processing: [],
	unreview: [],
	done: [],
	error: [],
	archive: []
})

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
