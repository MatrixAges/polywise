import { project, project_session } from '@core/db/schema'
import { env } from '@core/env'
import { eq, SQL } from 'drizzle-orm'

interface GetSessionProjectOptions {
	where?: SQL
}

export async function getSessionProject(options: GetSessionProjectOptions = {}) {
	const { where } = options
	let query = env.db
		.select({ project })
		.from(project_session)
		.innerJoin(project, eq(project_session.project_id, project.id))
		.$dynamic()

	if (where) query = query.where(where)

	const res = await query
	return res
}
