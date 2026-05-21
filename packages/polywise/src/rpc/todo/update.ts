import { todo_update_input_schema } from '@core/db/schemas'
import { setTodo } from '@core/db/services'
import { p } from '@core/utils'
import { eq } from 'drizzle-orm'
import { omit } from 'es-toolkit'

import { todo } from '../../db/schema'

import type { TodoInsert } from '@core/db'

const input_type = todo_update_input_schema

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/todo/update',
			summary: 'Run Update'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		return setTodo(eq(todo.id, input.id), omit(input, ['id']) as Partial<TodoInsert>)
	})
