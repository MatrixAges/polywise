import { project_todo, todo } from '@core/db/schema'
import { and, eq } from 'drizzle-orm'
import { object, string } from 'zod'

import { removeTodo } from '../../db/services'
import { removeProjectTodo } from '../../db/services/externals/project_todo'
import { p } from '../../utils/trpc'

const input_type = object({ project_id: string(), todo_id: string() })

export default p.input(input_type).mutation(async ({ input }) => {
	const where = and(eq(project_todo.project_id, input.project_id), eq(project_todo.todo_id, input.todo_id))!

	await removeProjectTodo(where)

	return removeTodo(eq(todo.id, input.todo_id))
})
