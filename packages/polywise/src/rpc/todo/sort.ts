import { getProjectTodo, getStandaloneTodos, setTodo } from '@core/db/services'
import { p } from '@core/utils'
import { asc, eq, sql } from 'drizzle-orm'
import { number, object, string } from 'zod'

import { project_todo, todo } from '../../db/schema'

import type { Todo } from '@core/db'

const input_type = object({
	todo_id: string(),
	to_status: string(),
	to_index: number().int().nonnegative(),
	project_id: string().optional()
})

const status_list = ['draft', 'pending', 'processing', 'unreview', 'done', 'error', 'archive'] as const
type TodoStatus = (typeof status_list)[number]

const status_order = sql`CASE ${todo.status} WHEN 'draft' THEN 0 WHEN 'pending' THEN 1 WHEN 'processing' THEN 2 WHEN 'unreview' THEN 3 WHEN 'done' THEN 4 WHEN 'error' THEN 5 WHEN 'archive' THEN 6 END`

const getTodoList = async (project_id?: string) => {
	if (project_id) {
		const rows = await getProjectTodo({
			where: eq(project_todo.project_id, project_id),
			orderBy: [status_order, asc(todo.order), asc(todo.created_at)]
		})

		return rows.map(item => item.todo)
	}

	const rows = await getStandaloneTodos()

	return rows.map(item => item.todo)
}

const createTodoGroup = () => {
	return status_list.reduce(
		(total, item) => {
			total[item] = []

			return total
		},
		{} as Record<TodoStatus, Array<Todo>>
	)
}

const isTodoStatus = (value: string): value is TodoStatus => {
	return status_list.includes(value as TodoStatus)
}

const groupTodosByStatus = (todos: Array<Todo>) => {
	const grouped_todos = createTodoGroup()

	for (const todo_item of todos) {
		if (!isTodoStatus(todo_item.status)) {
			continue
		}

		grouped_todos[todo_item.status].push(todo_item)
	}

	return grouped_todos
}

export default p.input(input_type).mutation(async ({ input }) => {
	const todos = await getTodoList(input.project_id)
	const active_todo = todos.find(item => item.id === input.todo_id)

	if (!active_todo || !isTodoStatus(active_todo.status) || !isTodoStatus(input.to_status)) {
		return todos
	}

	const grouped_todos = groupTodosByStatus(todos)
	const source_todos = [...grouped_todos[active_todo.status]]
	const target_todos = active_todo.status === input.to_status ? source_todos : [...grouped_todos[input.to_status]]
	const source_index = source_todos.findIndex(item => item.id === input.todo_id)

	if (source_index < 0) {
		return todos
	}

	const [moved_todo] = source_todos.splice(source_index, 1)

	if (!moved_todo) {
		return todos
	}

	const target_index = Math.max(0, Math.min(input.to_index, target_todos.length))

	target_todos.splice(target_index, 0, {
		...moved_todo,
		status: input.to_status
	})

	const next_grouped_todos = {
		...grouped_todos,
		[active_todo.status]: active_todo.status === input.to_status ? target_todos : source_todos,
		[input.to_status]: target_todos
	}

	const next_todos = status_list.flatMap(item => next_grouped_todos[item])

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
