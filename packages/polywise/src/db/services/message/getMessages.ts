import { message } from '@core/db/schema'
import { env } from '@core/env'
import { SQL } from 'drizzle-orm'

interface GetMessagesOptions {
	where?: SQL
	orderBy?: SQL | Array<SQL>
	limit?: number
}

export default async (options: GetMessagesOptions = {}) => {
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
