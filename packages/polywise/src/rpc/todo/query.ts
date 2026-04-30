import { getProjectTodo, getStandaloneTodos } from '@core/db/services'
import { p } from '@core/utils'
import { asc, eq, sql } from 'drizzle-orm'
import { boolean, object, string } from 'zod'

import { project_todo, todo } from '../../db/schema'

const input_type = object({
	project_id: string().optional(),
	is_project: boolean().optional()
}).optional()

const status_order = sql`CASE ${todo.status} WHEN 'draft' THEN 0 WHEN 'pending' THEN 1 WHEN 'processing' THEN 2 WHEN 'done' THEN 3 WHEN 'error' THEN 4 WHEN 'archive' THEN 5 END`

export default p.input(input_type).query(async ({ input }) => {
	if (input?.project_id) {
		const rows = await getProjectTodo({
			where: eq(project_todo.project_id, input.project_id),
			orderBy: [status_order, asc(todo.order), asc(todo.created_at)]
		})

		return rows.map(item => item.todo)
	}

	if (input?.is_project) {
		const rows = await getProjectTodo({
			orderBy: [asc(project_todo.project_id), status_order, asc(todo.order), asc(todo.created_at)]
		})
		const project_map = new Map<
			string,
			{ project: (typeof rows)[number]['project']; todos: Array<(typeof rows)[number]['todo']> }
		>()

		for (const item of rows) {
			const current_group = project_map.get(item.project.id)

			if (current_group) {
				current_group.todos.push(item.todo)

				continue
			}

			project_map.set(item.project.id, {
				project: item.project,
				todos: [item.todo]
			})
		}

		return [...project_map.values()].sort((prev, next) => prev.project.order - next.project.order)
	}

	const rows = await getStandaloneTodos()

	return rows.map(item => item.todo)
})
