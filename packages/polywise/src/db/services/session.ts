import { session } from '@core/db/schema'
import { env } from '@core/env'
import { SQL } from 'drizzle-orm'

import type { SessionInsert } from '@core/db'

export async function addSession(values: SessionInsert) {
	const [res] = await env.db.insert(session).values(values).returning()
	return res
}

export async function getSession(where: SQL) {
	const [res] = await env.db.select().from(session).where(where).limit(1)
	return res
}

export async function setSession(where: SQL, values: Partial<SessionInsert>) {
	const [res] = await env.db.update(session).set(values).where(where).returning()
	return res
}
