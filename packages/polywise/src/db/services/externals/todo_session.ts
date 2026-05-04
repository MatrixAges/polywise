import { todo_session } from '@core/db/schema'
import { env } from '@core/env'
import { SQL } from 'drizzle-orm'

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

export const removeTodoSession = async (where: SQL) => {
	return env.db
		.delete(todo_session)
		.where(where)
		.returning()
		.then(res => res[0])
}
