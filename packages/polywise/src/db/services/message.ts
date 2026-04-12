import { message } from '@core/db/schema'
import { env } from '@core/env'
import { SQL, sql } from 'drizzle-orm'

import type { MessageInsert } from '@core/db'

interface ArgsGetMessages {
	where?: SQL
	orderBy?: SQL | Array<SQL>
	limit?: number
}

export const addMessage = async (values: MessageInsert) => {
	return env.db
		.insert(message)
		.values(values)
		.returning()
		.then(res => res[0])
}

export const getMessages = async (args: ArgsGetMessages = {}) => {
	const { where, orderBy, limit } = args

	let query = env.db.select().from(message).$dynamic()

	if (where) query = query.where(where)

	if (orderBy) {
		const orderArgs = Array.isArray(orderBy) ? orderBy : [orderBy]

		query = query.orderBy(...orderArgs)
	}

	if (limit) query = query.limit(limit)

	return query
}

export const getMessagesCount = async (where?: SQL) => {
	return env.db
		.select({ count: sql<number>`count(*)` })
		.from(message)
		.where(where)
		.then(res => Number(res[0].count))
}

export const removeMessages = async (where?: SQL) => {
	return env.db.delete(message).where(where).returning()
}
