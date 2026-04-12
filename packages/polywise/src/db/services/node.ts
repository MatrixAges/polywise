import { node } from '@core/db/schema'
import { env } from '@core/env'
import { SQL } from 'drizzle-orm'

import type { NodeInsert } from '@core/db'

export async function addNode(values: NodeInsert) {
	const [res] = await env.db.insert(node).values(values).returning()
	return res
}

export async function getNode(where?: SQL) {
	const [res] = await env.db.select().from(node).where(where).limit(1)
	return res
}
