import { message } from '@core/db/schema'
import { env } from '@core/env'
import { eq, sql } from 'drizzle-orm'

import type Index from '../index'

export default async (s: Index) => {
	const [{ count }] = await env.db
		.select({ count: sql<number>`count(*)` })
		.from(message)
		.where(eq(message.session_id, s.id))

	return Number(count)
}
