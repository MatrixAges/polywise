import { group_todo } from '@core/db/schema'
import { env } from '@core/env'
import { SQL } from 'drizzle-orm'

import type { GroupTodoInsert } from '@core/db'

interface ArgsGetGroupTodos {
	where?: SQL
	orderBy?: SQL | Array<SQL>
	limit?: number
	offset?: number
}

export const addGroupTodo = async (values: GroupTodoInsert) => {
	return env.db
		.insert(group_todo)
		.values(values)
		.returning()
		.then(res => res[0])
}

export const getGroupTodo = async (where: SQL) => {
	return env.db
		.select()
		.from(group_todo)
		.where(where)
		.limit(1)
		.then(res => res[0])
}

export const getGroupTodos = async (args: ArgsGetGroupTodos = {}) => {
	const { where, orderBy, limit, offset } = args

	let query = env.db.select().from(group_todo).$dynamic()

	if (where) query = query.where(where)

	if (orderBy) {
		const order_args = Array.isArray(orderBy) ? orderBy : [orderBy]

		query = query.orderBy(...order_args)
	}

	if (limit) query = query.limit(limit)
	if (offset) query = query.offset(offset)

	return query
}

export const setGroupTodo = async (where: SQL, values: Partial<GroupTodoInsert>) => {
	return env.db
		.update(group_todo)
		.set(values)
		.where(where)
		.returning()
		.then(res => res[0])
}

export const removeGroupTodo = async (where: SQL) => {
	return env.db
		.delete(group_todo)
		.where(where)
		.returning()
		.then(res => res[0])
}
