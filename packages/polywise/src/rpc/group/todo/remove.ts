import { group_todo } from '@core/db/schema'
import { removeGroupTodo } from '@core/db/services'
import { eq } from 'drizzle-orm'
import { string } from 'zod'

import { p } from '../../../utils/trpc'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/group/todo/remove',
			description: 'Delete a todo item from a group workspace.'
		}
	})
	.input(string())
	.mutation(async ({ input }) => {
		return removeGroupTodo(eq(group_todo.id, input))
	})
