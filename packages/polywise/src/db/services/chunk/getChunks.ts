import { chunk } from '@core/db/schema'
import { env } from '@core/env'
import { SQL } from 'drizzle-orm'

interface GetChunksOptions {
	where?: SQL
	orderBy?: SQL | Array<SQL>
	limit?: number
}

export default async (options: GetChunksOptions = {}) => {
	const { where, orderBy, limit } = options
	let query = env.db.select().from(chunk).$dynamic()

	if (where) query = query.where(where)
	if (orderBy) {
		const orderArgs = Array.isArray(orderBy) ? orderBy : [orderBy]
		query = query.orderBy(...orderArgs)
	}
	if (limit) query = query.limit(limit)

	const res = await query

	return res
}
