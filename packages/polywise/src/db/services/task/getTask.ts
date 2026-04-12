import { task } from '@core/db/schema'
import { env } from '@core/env'
import { SQL } from 'drizzle-orm'

export default async (where?: SQL) => {
	const [res] = await env.db.select().from(task).where(where).limit(1)

	return res
}
