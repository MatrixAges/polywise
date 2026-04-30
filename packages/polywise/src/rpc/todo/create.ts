import { todo_create_input_schema } from '@core/db/schemas'
import { addProjectTodo, addTodo, getProjectTodo } from '@core/db/services'
import { p } from '@core/utils'
import { eq } from 'drizzle-orm'

import { project_todo } from '../../db/schema'

const input_type = todo_create_input_schema

const getNextProjectTodoOrder = async (project_id: string) => {
	const rows = await getProjectTodo({ where: eq(project_todo.project_id, project_id) })

	if (rows.length === 0) {
		return 0
	}

	const max_order = rows.reduce((current_max, item) => {
		return Math.max(current_max, item.todo.order)
	}, rows[0].todo.order)

	return max_order + 1
}

export default p.input(input_type).mutation(async ({ input }) => {
	const order = input.project_id ? await getNextProjectTodoOrder(input.project_id) : Date.now()
	const inserted = await addTodo({
		title: input.title,
		description: input.description,
		priority: input.priority,
		status: input.status,
		result: input.result,
		error: input.error,
		order,
		estimate: input.estimate,
		due_at: input.due_at ? new Date(input.due_at) : undefined,
		completed_at: input.status === 'done' ? new Date() : undefined
	})

	if (input.project_id) {
		await addProjectTodo(input.project_id, inserted.id)
	}

	return inserted
})
