import { chunk } from '@core/db/schema'
import { env } from '@core/env'
import { SQL } from 'drizzle-orm'

import type { ChunkInsert } from '@core/db'

interface ArgsGetChunks {
	where?: SQL
	orderBy?: SQL | Array<SQL>
	limit?: number
}

export const addChunk = async (values: ChunkInsert) => {
	return env.db
		.insert(chunk)
		.values(values)
		.returning()
		.then(res => res[0])
}

export const getChunks = async (args: ArgsGetChunks = {}) => {
	const { where, orderBy, limit } = args

	let query = env.db.select().from(chunk).$dynamic()

	if (where) query = query.where(where)

	if (orderBy) {
		const orderArgs = Array.isArray(orderBy) ? orderBy : [orderBy]

		query = query.orderBy(...orderArgs)
	}

	if (limit) query = query.limit(limit)

	return query
}

export const removeChunks = async (where: SQL) => {
	return env.db.delete(chunk).where(where).returning()
}
