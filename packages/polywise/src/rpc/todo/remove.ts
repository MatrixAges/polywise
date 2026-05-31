import { removeTodo } from '@core/db/services'
import { p } from '@core/utils'
import { eq } from 'drizzle-orm'
import { object, string } from 'zod'

import { todo } from '../../db/schema'

const input_type = object({ id: string() })

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/todo/remove',
			description: 'Delete a todo item.'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		return removeTodo(eq(todo.id, input.id))
	})
