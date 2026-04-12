import { node_chunk } from '@core/db/schema'
import { env } from '@core/env'
import { SQL } from 'drizzle-orm'

export default async (where: SQL) => {
	await env.db.delete(node_chunk).where(where)
}
