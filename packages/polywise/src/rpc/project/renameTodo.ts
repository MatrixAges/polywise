import { todo } from '@core/db/schema'
import { eq } from 'drizzle-orm'
import { object, string } from 'zod'

import { setTodo } from '../../db/services'
import { p } from '../../utils/trpc'

const input_type = object({ project_id: string(), todo_id: string(), title: string() })

export default p.input(input_type).mutation(async ({ input }) => {
	return setTodo(eq(todo.id, input.todo_id), { title: input.title })
})
