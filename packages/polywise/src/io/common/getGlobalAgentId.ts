import { agent } from '@core/db/schema'
import { env } from '@core/env'
import { eq } from 'drizzle-orm'

export default async () => {
	const [global_agent] = await env.db.select().from(agent).where(eq(agent.name, 'global')).limit(1)

	return global_agent.id
}
