import { agent, session_agent } from '@core/db/schema'
import { env } from '@core/env'
import { eq, SQL } from 'drizzle-orm'

interface GetSessionAgentsOptions {
	where?: SQL
}

export async function getSessionAgents(options: GetSessionAgentsOptions = {}) {
	const { where } = options
	let query = env.db
		.select({ agent })
		.from(session_agent)
		.innerJoin(agent, eq(session_agent.agent_id, agent.id))
		.$dynamic()

	if (where) query = query.where(where)

	const res = await query
	return res
}
