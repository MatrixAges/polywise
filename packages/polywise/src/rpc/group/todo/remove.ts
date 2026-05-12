import { group_todo } from '@core/db/schema'
import { removeGroupTodo } from '@core/db/services'
import { eq } from 'drizzle-orm'
import { string } from 'zod'

import { p } from '../../../utils/trpc'

export default p.input(string()).mutation(async ({ input }) => {
	return removeGroupTodo(eq(group_todo.id, input))
})
