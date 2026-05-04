import { setTodo } from '@core/db/services'
import { p } from '@core/utils'
import { eq } from 'drizzle-orm'
import { object, string } from 'zod'

import { todo } from '../../db/schema'

const input_type = object({ id: string() })

export default p.input(input_type).mutation(async ({ input }) => {
	return setTodo(eq(todo.id, input.id), { status: 'draft' })
})
