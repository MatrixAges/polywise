import { agent_session, session } from '@core/db/schema'
import { env } from '@core/env'
import { and, desc, eq, inArray, notInArray, SQL } from 'drizzle-orm'

interface ArgsGetAgentSessions {
	agent_id: string
	session_ids?: Array<string>
	exclude_session_ids?: Array<string>
	limit?: number
	offset?: number
}

export const getAgentSessions = async (args: ArgsGetAgentSessions) => {
	const { agent_id, session_ids, exclude_session_ids, limit, offset } = args
	const where_list = [eq(agent_session.agent_id, agent_id)]

	if (session_ids?.length) {
		where_list.push(inArray(agent_session.session_id, session_ids))
	}

	if (exclude_session_ids?.length) {
		where_list.push(notInArray(agent_session.session_id, exclude_session_ids))
	}

	let query = env.db
		.select({ session })
		.from(agent_session)
		.innerJoin(session, eq(agent_session.session_id, session.id))
		.where(and(...where_list))
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
