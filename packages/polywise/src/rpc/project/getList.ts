import { project_session, session } from '@core/db/schema'
import { env } from '@core/env'
import { desc, eq } from 'drizzle-orm'

import { getProjects } from '../../db/services'
import { p } from '../../utils/trpc'

export default p.query(async () => {
	const projects = await getProjects({ orderBy: 'asc' })

	return Promise.all(
		projects.map(async project => {
			const sessions = await env.db
				.select({ session })
				.from(project_session)
				.innerJoin(session, eq(project_session.session_id, session.id))
				.where(eq(project_session.project_id, project.id))
				.orderBy(desc(project_session.created_at))
				.limit(10)

			return {
				project,
				sessions
			}
		})
	)
})
