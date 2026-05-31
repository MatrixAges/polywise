import { getProjectTodo, getStandaloneTodos, setTodo } from '@core/db/services'
import { p } from '@core/utils'
import { eq } from 'drizzle-orm'
import { object, string } from 'zod'

import { project_todo, todo } from '../../db/schema'

const input_type = object({ id: string() })

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
			path: '/todo/unarchive',
			description: 'Restore an archived todo item to backlog and place it at the top of its list.'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		const project_item = await getProjectTodo({ where: eq(project_todo.todo_id, input.id), limit: 1 }).then(
			res => res[0]
		)
		const order = await getNextTodoOrder(project_item?.project.id)

		return setTodo(eq(todo.id, input.id), { status: 'backlog', order })
	})
