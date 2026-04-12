import { session_todo, todo } from '@core/db/schema'
import { env } from '@core/env'
import { eq, SQL } from 'drizzle-orm'

export async function addSessionTodo(session_id: string, todo_id: string) {
	const [res] = await env.db.insert(session_todo).values({ session_id, todo_id }).returning()
	return res
}

interface GetSessionTodosOptions {
	where?: SQL
	orderBy?: SQL | Array<SQL>
}

export async function getSessionTodos(options: GetSessionTodosOptions = {}) {
	const { where, orderBy } = options
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

	const res = await query
	return res
}
