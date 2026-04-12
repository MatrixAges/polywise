import { task } from '@core/db/schema'
import { env } from '@core/env'
import { SQL } from 'drizzle-orm'

import type { TaskInsert } from '@core/db'

export async function addTask(values: TaskInsert) {
	const [res] = await env.db.insert(task).values(values).returning()
	return res
}

export async function getTask(where?: SQL) {
	const [res] = await env.db.select().from(task).where(where).limit(1)
	return res
}

interface GetTasksOptions {
	where?: SQL
	orderBy?: SQL | Array<SQL>
	limit?: number
}

export async function getTasks(options: GetTasksOptions = {}) {
	const { where, orderBy, limit } = options
	let query = env.db.select().from(task).$dynamic()

	if (where) query = query.where(where)
	if (orderBy) {
		const orderArgs = Array.isArray(orderBy) ? orderBy : [orderBy]
		query = query.orderBy(...orderArgs)
	}
	if (limit) query = query.limit(limit)

	const res = await query
	return res
}

export async function removeTask(where: SQL) {
	await env.db.delete(task).where(where)
}

export async function setTask(where: SQL, values: Partial<TaskInsert>) {
	const res = await env.db.update(task).set(values).where(where).returning()
	return res
}
