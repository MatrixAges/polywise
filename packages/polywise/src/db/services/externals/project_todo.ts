import { project, project_todo, todo } from '@core/db/schema'
import { env } from '@core/env'
import { eq, SQL } from 'drizzle-orm'

interface ArgsGetProjectTodo {
	where?: SQL
	orderBy?: SQL | Array<SQL>
	limit?: number
	offset?: number
}

export const getProjectTodo = async (args: ArgsGetProjectTodo = {}) => {
	const { where, orderBy, limit, offset } = args

	let query = env.db
		.select({ project, todo })
		.from(project_todo)
		.innerJoin(project, eq(project_todo.project_id, project.id))
		.innerJoin(todo, eq(project_todo.todo_id, todo.id))
		.$dynamic()

	if (where) query = query.where(where)

	if (orderBy) {
		const order_args = Array.isArray(orderBy) ? orderBy : [orderBy]

		query = query.orderBy(...order_args)
	}

	if (limit) query = query.limit(limit)

	if (offset) query = query.offset(offset)

	return query
}

export const addProjectTodo = async (project_id: string, todo_id: string) => {
	return env.db
		.insert(project_todo)
		.values({ project_id, todo_id })
		.returning()
		.then(res => res[0])
}

export const removeProjectTodo = async (where: SQL) => {
	return env.db
		.delete(project_todo)
		.where(where)
		.returning()
		.then(res => res[0])
}
