import { project, project_session } from '@core/db/schema'
import { env } from '@core/env'
import { eq } from 'drizzle-orm'

import type Index from '../index'

export default async (s: Index) => {
	const res = await env.db
		.select({ project })
		.from(project_session)
		.innerJoin(project, eq(project_session.project_id, project.id))
		.where(eq(project_session.session_id, s.id))

	s.projects = res.map(item => item.project)
}
