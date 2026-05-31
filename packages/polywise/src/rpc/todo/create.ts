import { todo_create_input_schema } from '@core/db/schemas'
import { addProjectTodo, addTodo, getProjectTodo, getStandaloneTodos } from '@core/db/services'
import { p } from '@core/utils'
import { eq } from 'drizzle-orm'

import { project_todo } from '../../db/schema'

const input_type = todo_create_input_schema

const getNextTodoOrder = async (project_id?: string) => {
	const rows = project_id
		? await getProjectTodo({ where: eq(project_todo.project_id, project_id) })
		: await getStandaloneTodos()

	if (rows.length === 0) {
		return 0
	}

	const min_order = rows.reduce((current_min, item) => {
		return Math.min(current_min, item.todo.order)
	}, rows[0].todo.order)

	return min_order - 1
}

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/todo/create',
			description: 'Run Create'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		const order = await getNextTodoOrder(input.project_id)

		const inserted = await addTodo({
			title: input.title,
			description: input.description,
			priority: input.priority,
			status: input.status,
			result: input.result,
			error: input.error,
			order,
			estimate: input.estimate,
			due_at: input.due_at ? new Date(input.due_at) : undefined
		})

		if (input.project_id) {
			await addProjectTodo(input.project_id, inserted.id)
		}

		return inserted
	})
