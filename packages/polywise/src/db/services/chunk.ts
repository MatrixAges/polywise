import { chunk } from '@core/db/schema'
import { env } from '@core/env'
import { SQL } from 'drizzle-orm'

import type { ChunkInsert } from '@core/db'

export async function addChunk(values: ChunkInsert) {
	const [res] = await env.db.insert(chunk).values(values).returning()
	return res
}

interface GetChunksOptions {
	where?: SQL
	orderBy?: SQL | Array<SQL>
	limit?: number
}

export async function getChunks(options: GetChunksOptions = {}) {
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

export async function removeChunks(where: SQL) {
	await env.db.delete(chunk).where(where)
}
