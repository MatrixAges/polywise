import {
	addProjectTodo,
	getProjectTodo,
	getStandaloneTodos,
	getTodo,
	removeProjectTodo,
	setTodo
} from '@core/db/services'
import { p } from '@core/utils'
import { eq } from 'drizzle-orm'
import { object, string } from 'zod'

import { project_todo, todo } from '../../db/schema'

const input_type = object({
	id: string(),
	project_id: string().optional()
})

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
			path: '/todo/assignProject',
			description: 'Run Assign Project'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		const current_project_item = await getProjectTodo({
			where: eq(project_todo.todo_id, input.id),
			limit: 1
		}).then(res => res[0])
		const current_project_id = current_project_item?.project.id

		if (current_project_id === input.project_id) {
			return getTodo(eq(todo.id, input.id))
		}

		const next_order = await getNextTodoOrder(input.project_id)

		if (current_project_id) {
			await removeProjectTodo(eq(project_todo.todo_id, input.id))
		}

		if (input.project_id) {
			await addProjectTodo(input.project_id, input.id)
		}

		return setTodo(eq(todo.id, input.id), { order: next_order })
	})
