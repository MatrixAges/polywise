import { group, group_session, session } from '@core/db/schema'
import { env } from '@core/env'
import { desc, eq, SQL } from 'drizzle-orm'

export const addGroupSession = async (group_id: string, session_id: string) => {
	return env.db
		.insert(group_session)
		.values({ group_id, session_id })
		.returning()
		.then(res => res[0])
}

export const getSessionGroup = async (where: SQL) => {
	return env.db
		.select({ group, group_session })
		.from(group_session)
		.innerJoin(group, eq(group_session.group_id, group.id))
		.where(where)
		.limit(1)
		.then(res => res[0])
}

interface ArgsGetGroupSessions {
	where?: SQL
}

export const getGroupSessions = async (args: ArgsGetGroupSessions = {}) => {
	const { where } = args

	let query = env.db
		.select({ session, group_session })
		.from(group_session)
		.innerJoin(session, eq(group_session.session_id, session.id))
		.orderBy(desc(group_session.created_at))
		.$dynamic()

	if (where) query = query.where(where)

	return query
}

export const getGroupSession = async (where: SQL) => {
	return env.db
		.select()
		.from(group_session)
		.where(where)
		.limit(1)
		.then(res => res[0])
}

export const removeGroupSession = async (where: SQL) => {
	return env.db
		.delete(group_session)
		.where(where)
		.returning()
		.then(res => res[0])
}
