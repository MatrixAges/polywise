import { todo, todo_session } from '@core/db/schema'
import { env } from '@core/env'
import { and, eq, inArray, SQL } from 'drizzle-orm'

import { getTodos, setTodo } from '../todo'

type TodoStatus = (typeof todo.$inferSelect)['status']

interface ArgsSyncTodoSessionStatusBySessionId {
	session_id: string
	from_status_list: Array<TodoStatus>
	to_status: TodoStatus
}

interface ArgsSyncTodoSessionStatusByTodoId {
	todo_id: string
	from_status_list: Array<TodoStatus>
	to_status: TodoStatus
}

export const addTodoSession = async (todo_id: string, session_id: string) => {
	return env.db
		.insert(todo_session)
		.values({ todo_id, session_id })
		.returning()
		.then(res => res[0])
}

export const getTodoSession = async (where: SQL) => {
	return env.db
		.select()
		.from(todo_session)
		.where(where)
		.limit(1)
		.then(res => res[0])
}

export const getTodoSessions = async (where: SQL) => {
	return env.db.select().from(todo_session).where(where)
}

const getSessionTodoIds = async (session_id: string) => {
	const session_links = await getTodoSessions(eq(todo_session.session_id, session_id))

	return Array.from(new Set(session_links.map(item => item.todo_id)))
}

const syncTodoSessionStatus = async (
	args: ArgsSyncTodoSessionStatusByTodoId | ArgsSyncTodoSessionStatusBySessionId
) => {
	const { from_status_list, to_status } = args
	const target_todo_ids = 'todo_id' in args ? [args.todo_id] : await getSessionTodoIds(args.session_id)

	if (target_todo_ids.length === 0) {
		return []
	}

	const target_todos = await getTodos({
		where: and(inArray(todo.id, target_todo_ids), inArray(todo.status, from_status_list))
	})

	if (target_todos.length === 0) {
		return []
	}

	return Promise.all(target_todos.map(item => setTodo(eq(todo.id, item.id), { status: to_status })))
}

export const syncTodoSessionStatusBySessionId = async (args: ArgsSyncTodoSessionStatusBySessionId) => {
	return syncTodoSessionStatus(args)
}

export const syncTodoSessionStatusByTodoId = async (args: ArgsSyncTodoSessionStatusByTodoId) => {
	return syncTodoSessionStatus(args)
}

export const removeTodoSession = async (where: SQL) => {
	return env.db
		.delete(todo_session)
		.where(where)
		.returning()
		.then(res => res[0])
}
