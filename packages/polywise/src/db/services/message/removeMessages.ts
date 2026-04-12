import { message } from '@core/db/schema'
import { env } from '@core/env'
import { SQL } from 'drizzle-orm'

export default async (where?: SQL) => {
	await env.db.delete(message).where(where)
}
