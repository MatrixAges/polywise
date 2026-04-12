import { node_chunk } from '@core/db/schema'
import { env } from '@core/env'
import { SQL } from 'drizzle-orm'

export const addNodeChunk = async (node_id: string, chunk_id: string) => {
	return env.db.insert(node_chunk).values({ node_id, chunk_id }).returning()
}

export const removeNodeChunk = async (where: SQL) => {
	return env.db.delete(node_chunk).where(where).returning()
}
