import { post_project, project } from '@core/db/schema'
import { env } from '@core/env'
import { asc, desc, eq, SQL } from 'drizzle-orm'

interface ArgsGetPostProjects {
	where?: SQL
	limit?: number
	offset?: number
}

export const getPostProjects = async (args: ArgsGetPostProjects = {}) => {
	const { where, limit, offset } = args

	let query = env.db
		.select({ project, post_project })
		.from(post_project)
		.innerJoin(project, eq(post_project.project_id, project.id))
		.orderBy(desc(post_project.created_at), project.order, asc(project.created_at))
		.$dynamic()

	if (where) query = query.where(where)
	if (limit) query = query.limit(limit)
	if (offset) query = query.offset(offset)

	return query
}

export const addPostProject = async (post_id: string, project_id: string) => {
	return env.db
		.insert(post_project)
		.values({ post_id, project_id })
		.returning()
		.then(res => res[0])
}

export const removePostProject = async (where: SQL) => {
	return env.db
		.delete(post_project)
		.where(where)
		.returning()
		.then(res => res[0])
}
