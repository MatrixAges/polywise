import { message } from '@core/db/schema'
import { env } from '@core/env'
import { SQL, sql } from 'drizzle-orm'

export default async (where?: SQL) => {
	const [{ count }] = await env.db
		.select({ count: sql<number>`count(*)` })
		.from(message)
		.where(where)

	return Number(count)
}
