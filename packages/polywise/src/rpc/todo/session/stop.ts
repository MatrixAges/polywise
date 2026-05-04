import { session_todo } from '@core/db/schema'
import { getSessionTodo } from '@core/db/services'
import { p, SessionEventStore } from '@core/utils'
import { eq } from 'drizzle-orm'
import { object, string } from 'zod'

const input_type = object({ todo_id: string() })

export default p.input(input_type).mutation(async ({ input }) => {
	const session_link = await getSessionTodo(eq(session_todo.todo_id, input.todo_id))

	if (!session_link) {
		return null
	}

	SessionEventStore.emit(`${session_link.session_id}/stop`)

	return session_link
})
