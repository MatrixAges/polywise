import { session } from '@core/db/schema'
import { env } from '@core/env'
import { eq } from 'drizzle-orm'

import type Index from '../index'

export default async (s: Index) => {
	const [res] = await env.db.select().from(session).where(eq(session.id, s.id)).limit(1)

	s.session = res

	await s.getModel()
}
