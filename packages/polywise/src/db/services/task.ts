import { task } from '@core/db/schema'
import { env } from '@core/env'
import { SQL } from 'drizzle-orm'

import type { TaskInsert } from '@core/db'

interface ArgsGetTasks {
	where?: SQL
	orderBy?: SQL | Array<SQL>
	limit?: number
}

export const addTask = async (values: TaskInsert) => {
	return env.db
		.insert(task)
		.values(values)
		.returning()
		.then(res => res[0])
}

export const getTask = async (where?: SQL) => {
	return env.db
		.select()
		.from(task)
		.where(where)
		.limit(1)
		.then(res => res[0])
}

export const getTasks = async (args: ArgsGetTasks = {}) => {
	const { where, orderBy, limit } = args

	let query = env.db.select().from(task).$dynamic()

	if (where) query = query.where(where)

	if (orderBy) {
		const orderArgs = Array.isArray(orderBy) ? orderBy : [orderBy]

		query = query.orderBy(...orderArgs)
	}

	if (limit) query = query.limit(limit)

	return query
}

export const removeTask = async (where: SQL) => {
	return env.db.delete(task).where(where).returning()
}

export const setTask = async (where: SQL, values: Partial<TaskInsert>) => {
	return env.db.update(task).set(values).where(where).returning()
}
