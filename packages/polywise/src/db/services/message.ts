import { message } from '@core/db/schema'
import { env } from '@core/env'
import { SQL, sql } from 'drizzle-orm'

import type { MessageInsert } from '@core/db'

export async function addMessage(values: MessageInsert) {
	const [res] = await env.db.insert(message).values(values).returning()
	return res
}

interface GetMessagesOptions {
	where?: SQL
	orderBy?: SQL | Array<SQL>
	limit?: number
}

export async function getMessages(options: GetMessagesOptions = {}) {
	const { where, orderBy, limit } = options
	let query = env.db.select().from(message).$dynamic()

	if (where) query = query.where(where)
	if (orderBy) {
		const orderArgs = Array.isArray(orderBy) ? orderBy : [orderBy]
		query = query.orderBy(...orderArgs)
	}
	if (limit) query = query.limit(limit)

	const res = await query
	return res
}

export async function getMessagesCount(where?: SQL) {
	const [{ count }] = await env.db
		.select({ count: sql<number>`count(*)` })
		.from(message)
		.where(where)

	return Number(count)
}

export async function removeMessages(where?: SQL) {
	await env.db.delete(message).where(where)
}
