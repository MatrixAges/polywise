import { agent_session, session } from '@core/db/schema'
import { env } from '@core/env'
import { desc, eq, SQL } from 'drizzle-orm'

interface ArgsGetAgentSessions {
	agent_id: string
	limit?: number
	offset?: number
}

export const getAgentSessions = async (args: ArgsGetAgentSessions) => {
	const { agent_id, limit, offset } = args

	let query = env.db
		.select({ session })
		.from(agent_session)
		.innerJoin(session, eq(agent_session.session_id, session.id))
		.where(eq(agent_session.agent_id, agent_id))
		.orderBy(desc(agent_session.created_at))
		.$dynamic()

	if (limit) query = query.limit(limit)
	if (offset) query = query.offset(offset)

	return query
}

export const addAgentSession = async (agent_id: string, session_id: string) => {
	return env.db
		.insert(agent_session)
		.values({ agent_id, session_id })
		.returning()
		.then(res => res[0])
}

export const removeAgentSession = async (where: SQL) => {
	return env.db
		.delete(agent_session)
		.where(where)
		.returning()
		.then(res => res[0])
}
