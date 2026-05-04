import { session_todo, todo } from '@core/db/schema'
import { addSession, addSessionTodo, getSession, getSessionTodo, getTodo, removeSessionTodo } from '@core/db/services'
import { submit } from '@core/fst/utils'
import { p } from '@core/utils'
import { eq } from 'drizzle-orm'
import { object, string } from 'zod'

const input_type = object({ todo_id: string() })

const getLinkedSession = async (todo_id: string) => {
	const session_link = await getSessionTodo(eq(session_todo.todo_id, todo_id))

	if (!session_link) {
		return null
	}

	const linked_session = await getSession(eq(session_todo.session_id, session_link.session_id))

	if (linked_session) {
		return linked_session
	}

	await removeSessionTodo(eq(session_todo.todo_id, todo_id))

	return null
}

export default p.input(input_type).mutation(async ({ input }) => {
	const todo_item = await getTodo(eq(todo.id, input.todo_id))

	if (!todo_item) {
		throw new Error(`Todo not found: ${input.todo_id}`)
	}

	const linked_session = await getLinkedSession(input.todo_id)
	const session_item = linked_session ?? (await addSession({ title: todo_item.title }))

	if (!linked_session) {
		await addSessionTodo(session_item.id, input.todo_id)
	}

	await submit({ id: session_item.id }, todo_item.title)

	return session_item
})
