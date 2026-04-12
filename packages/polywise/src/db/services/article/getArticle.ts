import { article } from '@core/db/schema'
import { env } from '@core/env'
import { SQL } from 'drizzle-orm'

export default async (where: SQL) => {
	const [res] = await env.db.select().from(article).where(where).limit(1)

	return res
}
