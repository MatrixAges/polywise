import { session } from '@core/db/schema'
import { env } from '@core/env'
import { SQL } from 'drizzle-orm'

import type { SessionInsert } from '@core/db'

export default async (where: SQL, values: Partial<SessionInsert>) => {
	const [res] = await env.db.update(session).set(values).where(where).returning()

	return res
}
