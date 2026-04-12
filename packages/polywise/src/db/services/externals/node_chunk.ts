import { node_chunk } from '@core/db/schema'
import { env } from '@core/env'
import { SQL } from 'drizzle-orm'

export async function addNodeChunk(node_id: string, chunk_id: string) {
	await env.db.insert(node_chunk).values({ node_id, chunk_id }).onConflictDoNothing()
}

export async function removeNodeChunk(where: SQL) {
	await env.db.delete(node_chunk).where(where)
}
