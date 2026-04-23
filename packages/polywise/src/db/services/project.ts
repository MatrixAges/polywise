import { project } from '@core/db/schema'
import { env } from '@core/env'
import { desc, eq, SQL } from 'drizzle-orm'

import type { ProjectInsert } from '@core/db'

export const addProject = async (values: ProjectInsert) => {
	return env.db
		.insert(project)
		.values(values)
		.returning()
		.then(res => res[0])
}

export const getProject = async (where: SQL) => {
	return env.db
		.select()
		.from(project)
		.where(where)
		.limit(1)
		.then(res => res[0])
}

interface ArgsGetProjects {
	where?: SQL
	orderBy?: 'asc' | 'desc'
	limit?: number
	offset?: number
}

export const getProjects = async (args: ArgsGetProjects = {}) => {
	const { where, orderBy = 'desc', limit, offset } = args

	let query = env.db.select().from(project).$dynamic()

	if (where) query = query.where(where)

	if (orderBy === 'desc') {
		query = query.orderBy(desc(project.order), desc(project.created_at))
	} else {
		query = query.orderBy(project.order, desc(project.created_at))
	}

	if (limit) query = query.limit(limit)

	if (offset) query = query.offset(offset)

	return query
}

export const setProject = async (where: SQL, values: Partial<ProjectInsert>) => {
	return env.db
		.update(project)
		.set(values)
		.where(where)
		.returning()
		.then(res => res[0])
}

export const removeProject = async (where: SQL) => {
	return env.db
		.delete(project)
		.where(where)
		.returning()
		.then(res => res[0])
}
