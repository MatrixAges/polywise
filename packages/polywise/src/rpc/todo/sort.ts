import { getProjectTodo, getStandaloneTodos, setTodo } from '@core/db/services'
import { p } from '@core/utils'
import { asc, eq, sql } from 'drizzle-orm'
import { number, object, string } from 'zod'

import { project_todo, todo } from '../../db/schema'
import arrayMove from '../../utils/arrayMove'

const input_type = object({
	from: number().int(),
	to: number().int(),
	project_id: string().optional()
})

const status_order = sql`CASE ${todo.status} WHEN 'draft' THEN 0 WHEN 'pending' THEN 1 WHEN 'processing' THEN 2 WHEN 'done' THEN 3 WHEN 'error' THEN 4 WHEN 'archive' THEN 5 END`

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

export default p.input(input_type).mutation(async ({ input }) => {
	const todos = await getTodoList(input.project_id)

	if (!todos[input.from] || input.to > todos.length - 1) {
		return todos
	}

	const next_todos = arrayMove({ list: todos, from: input.from, to: input.to })

	await Promise.all(next_todos.map((item, index) => setTodo(eq(todo.id, item.id), { order: index })))

	return next_todos
})
