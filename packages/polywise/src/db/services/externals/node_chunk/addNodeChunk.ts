import { node_chunk } from '@core/db/schema'
import { env } from '@core/env'

export default async (node_id: string, chunk_id: string) => {
	await env.db.insert(node_chunk).values({ node_id, chunk_id }).onConflictDoNothing()
}
