import { project, project_session, session } from '@core/db/schema'
import { env } from '@core/env'
import { desc, eq, SQL } from 'drizzle-orm'

interface ArgsGetSessionProject {
	where?: SQL
}

export const getSessionProject = async (args: ArgsGetSessionProject = {}) => {
	const { where } = args

	let query = env.db
		.select({ project })
		.from(project_session)
		.innerJoin(project, eq(project_session.project_id, project.id))
		.$dynamic()

	if (where) query = query.where(where)

	return query
}

interface ArgsGetProjectSessions {
	project_id: string
	limit?: number
	offset?: number
}

export const getProjectSessions = async (args: ArgsGetProjectSessions) => {
	const { project_id, limit, offset } = args

	let query = env.db
		.select({ session })
		.from(project_session)
		.innerJoin(session, eq(project_session.session_id, session.id))
		.where(eq(project_session.project_id, project_id))
		.orderBy(desc(project_session.created_at))
		.$dynamic()

	if (limit) query = query.limit(limit)
	if (offset) query = query.offset(offset)

	return query
}

export const getProjectSessionIdList = async () => {
	const list = await env.db.select({ session_id: project_session.session_id }).from(project_session)

	return list.map(item => item.session_id)
}

export const addProjectSession = async (project_id: string, session_id: string) => {
	return env.db
		.insert(project_session)
		.values({ project_id, session_id })
		.returning()
		.then(res => res[0])
}

export const removeProjectSession = async (where: SQL) => {
	return env.db
		.delete(project_session)
		.where(where)
		.returning()
		.then(res => res[0])
}
