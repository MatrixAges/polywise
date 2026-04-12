import { agent, session_agent } from '@core/db/schema'
import { env } from '@core/env'
import { eq, SQL } from 'drizzle-orm'

interface ArgsGetSessionAgents {
	where?: SQL
}

export const getSessionAgents = async (args: ArgsGetSessionAgents = {}) => {
	const { where } = args

	let query = env.db
		.select({ agent })
		.from(session_agent)
		.innerJoin(agent, eq(session_agent.agent_id, agent.id))
		.$dynamic()

	if (where) query = query.where(where)

	return query
}
