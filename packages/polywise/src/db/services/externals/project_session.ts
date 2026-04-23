import { project, project_session } from '@core/db/schema'
import { env } from '@core/env'
import { eq, SQL } from 'drizzle-orm'

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
