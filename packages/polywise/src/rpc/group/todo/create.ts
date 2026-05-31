import { group_todo } from '@core/db/schema'
import { addGroupTodo } from '@core/db/services'
import { array, object, string } from 'zod'

import { p } from '../../../utils/trpc'

const input_type = object({
	group_id: string(),
	title: string(),
	description: string().optional(),
	status: string().default('backlog'),
	priority: string().default('none'),
	assignee_agent_id: string().optional()
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/group/todo/create',
			description: 'Run Create'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		const count = 0

		return addGroupTodo({
			group_id: input.group_id,
			title: input.title,
			description: input.description || undefined,
			status: input.status,
			priority: input.priority,
			order: count,
			assignee_agent_id: input.assignee_agent_id || undefined
		})
	})
