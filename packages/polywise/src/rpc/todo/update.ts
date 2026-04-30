import { todo_update_input_schema } from '@core/db/schemas'
import { getTodo, setTodo } from '@core/db/services'
import { p } from '@core/utils'
import { eq } from 'drizzle-orm'

import { todo } from '../../db/schema'

const input_type = todo_update_input_schema

export default p.input(input_type).mutation(async ({ input }) => {
	const current_todo = await getTodo(eq(todo.id, input.id))

	if (!current_todo) {
		return current_todo
	}

	const completed_at =
		input.status === undefined
			? undefined
			: input.status === 'done'
				? current_todo.status === 'done'
					? current_todo.completed_at
					: new Date()
				: null

	return setTodo(eq(todo.id, input.id), {
		title: input.title,
		description: input.description,
		priority: input.priority,
		status: input.status,
		result: input.result,
		error: input.error,
		estimate: input.estimate,
		due_at: input.due_at === undefined ? undefined : input.due_at === null ? null : new Date(input.due_at),
		completed_at
	})
})
