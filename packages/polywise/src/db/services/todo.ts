import { getTodoStatusOrder } from '@core/consts/db'
import { project_todo, session_todo, todo } from '@core/db/schema'
import { env } from '@core/env'
import { and, asc, isNull, SQL, sql } from 'drizzle-orm'

import type { TodoInsert } from '@core/db'

const status_order = getTodoStatusOrder(todo.status)

interface ArgsGetTodos {
	where?: SQL
	orderBy?: SQL | Array<SQL>
	limit?: number
	offset?: number
}

export const addTodo = async (values: TodoInsert) => {
	return env.db
		.insert(todo)
		.values(values)
		.returning()
		.then(res => res[0])
}

export const getTodo = async (where: SQL) => {
	return env.db
		.select()
		.from(todo)
		.where(where)
		.limit(1)
		.then(res => res[0])
}

export const getTodos = async (args: ArgsGetTodos = {}) => {
	const { where, orderBy, limit, offset } = args

	let query = env.db.select().from(todo).$dynamic()

	if (where) query = query.where(where)

	if (orderBy) {
		const order_args = Array.isArray(orderBy) ? orderBy : [orderBy]

		query = query.orderBy(...order_args)
	}

	if (limit) query = query.limit(limit)

	if (offset) query = query.offset(offset)

	return query
}

export const getStandaloneTodos = async (args: ArgsGetTodos = {}) => {
	const { where, orderBy, limit, offset } = args
	const base_where = and(isNull(session_todo.todo_id), isNull(project_todo.todo_id), where)
	const order_args = orderBy
		? Array.isArray(orderBy)
			? orderBy
			: [orderBy]
		: [status_order, asc(todo.order), asc(todo.created_at)]

	let query = env.db
		.select({ todo })
		.from(todo)
		.leftJoin(session_todo, sql`${todo.id} = ${session_todo.todo_id}`)
		.leftJoin(project_todo, sql`${todo.id} = ${project_todo.todo_id}`)
		.where(base_where)
		.orderBy(...order_args)
		.$dynamic()

	if (limit) query = query.limit(limit)

	if (offset) query = query.offset(offset)

	return query
}

export const getStandaloneTodosCount = async (where?: SQL) => {
	const base_where = and(isNull(session_todo.todo_id), isNull(project_todo.todo_id), where)

	return env.db
		.select({ count: sql<number>`count(*)` })
		.from(todo)
		.leftJoin(session_todo, sql`${todo.id} = ${session_todo.todo_id}`)
		.leftJoin(project_todo, sql`${todo.id} = ${project_todo.todo_id}`)
		.where(base_where)
		.then(res => Number(res[0].count))
}

export const setTodo = async (where: SQL, values: Partial<TodoInsert>) => {
	return env.db
		.update(todo)
		.set(values)
		.where(where)
		.returning()
		.then(res => res[0])
}

export const removeTodo = async (where: SQL) => {
	return env.db
		.delete(todo)
		.where(where)
		.returning()
		.then(res => res[0])
}
