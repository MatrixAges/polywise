import { todo, todo_session } from '@core/db/schema'
import {
	addSession,
	addTodoSession,
	getSession,
	getTodo,
	getTodoSession,
	removeTodoSession,
	syncTodoSessionStatusByTodoId
} from '@core/db/services'
import { addProjectSession } from '@core/db/services/externals/project_session'
import { emitChange, submit } from '@core/fst/utils'
import { p } from '@core/utils'
import { eq } from 'drizzle-orm'
import { object, string } from 'zod'

const input_type = object({
	todo_id: string(),
	project_id: string().optional()
})

const start_status_list = ['backlog', 'unreview', 'done', 'canceled', 'error'] as const

const getLinkedSession = async (todo_id: string) => {
	const session_link = await getTodoSession(eq(todo_session.todo_id, todo_id))

	if (!session_link) {
		return null
	}

	const linked_session = await getSession(eq(todo_session.session_id, session_link.session_id))

	if (linked_session) {
		return linked_session
	}

	await removeTodoSession(eq(todo_session.todo_id, todo_id))

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
		await addTodoSession(input.todo_id, session_item.id)

		if (input.project_id) {
			await addProjectSession(input.project_id, session_item.id)
		}
	}

	await syncTodoSessionStatusByTodoId({
		todo_id: input.todo_id,
		from_status_list: [...start_status_list],
		to_status: 'processing'
	})

	try {
		await submit({ id: session_item.id }, todo_item.title)
	} catch (error) {
		await syncTodoSessionStatusByTodoId({
			todo_id: input.todo_id,
			from_status_list: ['processing'],
			to_status: 'error'
		})

		await emitChange({
			session: session_item,
			running_since: session_item.running_since ?? null,
			running_done: session_item.running_done ?? null
		})

		throw error
	}

	return session_item
})
