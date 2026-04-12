import { edge } from '@core/db/schema'
import { env } from '@core/env'
import { SQL } from 'drizzle-orm'

import type { EdgeInsert } from '@core/db'

export async function addEdge(values: EdgeInsert) {
	const [res] = await env.db.insert(edge).values(values).returning()
	return res
}

export async function getEdge(where?: SQL) {
	const [res] = await env.db.select().from(edge).where(where).limit(1)
	return res
}
