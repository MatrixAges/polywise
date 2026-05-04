import { session_todo, todo } from '@core/db/schema'
import { env } from '@core/env'
import { eq, SQL } from 'drizzle-orm'

interface ArgsGetSessionTodos {
	where?: SQL
	orderBy?: SQL | Array<SQL>
}

export const addSessionTodo = async (session_id: string, todo_id: string) => {
	return env.db
		.insert(session_todo)
		.values({ session_id, todo_id })
		.returning()
		.then(res => res[0])
}

export const getSessionTodos = async (args: ArgsGetSessionTodos = {}) => {
	const { where, orderBy } = args

	let query = env.db
		.select({ todo })
		.from(session_todo)
		.innerJoin(todo, eq(session_todo.todo_id, todo.id))
		.$dynamic()

	if (where) query = query.where(where)

	if (orderBy) {
		const orderArgs = Array.isArray(orderBy) ? orderBy : [orderBy]

		query = query.orderBy(...orderArgs)
	}

	return query
}

export const getSessionTodo = async (where: SQL) => {
	return env.db
		.select()
		.from(session_todo)
		.where(where)
		.limit(1)
		.then(res => res[0])
}

export const removeSessionTodo = async (where: SQL) => {
	return env.db
		.delete(session_todo)
		.where(where)
		.returning()
		.then(res => res[0])
}
