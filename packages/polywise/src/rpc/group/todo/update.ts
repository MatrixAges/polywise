import { group_todo } from '@core/db/schema'
import { setGroupTodo } from '@core/db/services'
import { eq } from 'drizzle-orm'
import { object, string } from 'zod'

import { p } from '../../../utils/trpc'

const input_type = object({
	id: string(),
	title: string().optional(),
	description: string().optional(),
	status: string().optional(),
	priority: string().optional(),
	result: string().optional(),
	error: string().optional(),
	assignee_agent_id: string().optional()
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/group/todo/update',
			description: 'Run Update'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		return setGroupTodo(eq(group_todo.id, input.id), {
			...(input.title !== undefined ? { title: input.title } : {}),
			...(input.description !== undefined ? { description: input.description } : {}),
			...(input.status !== undefined ? { status: input.status } : {}),
			...(input.priority !== undefined ? { priority: input.priority } : {}),
			...(input.result !== undefined ? { result: input.result } : {}),
			...(input.error !== undefined ? { error: input.error } : {}),
			...(input.assignee_agent_id !== undefined ? { assignee_agent_id: input.assignee_agent_id } : {})
		})
	})
