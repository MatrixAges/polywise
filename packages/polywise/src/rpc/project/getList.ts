import { project_session, session } from '@core/db/schema'
import { env } from '@core/env'
import { desc, eq } from 'drizzle-orm'

import { getProjects } from '../../db/services'
import { p } from '../../utils/trpc'

import type { IProjectSerializedProjectItem } from './types'

const serializeSessionItem = (args: { session_item: typeof session.$inferSelect; project_id: string }) => {
	const { session_item, project_id } = args

	return {
		...session_item,
		created_at: session_item.created_at ? session_item.created_at.toISOString() : null,
		updated_at: session_item.updated_at ? session_item.updated_at.toISOString() : null,
		project_id
	}
}

export default p.query(async () => {
	const projects = await getProjects({ orderBy: 'asc' })

	const sessions = await Promise.all(
		projects.map(async project_item => {
			const session_rows = await env.db
				.select({ session })
				.from(project_session)
				.innerJoin(session, eq(project_session.session_id, session.id))
				.where(eq(project_session.project_id, project_item.id))
				.orderBy(desc(project_session.created_at))
				.limit(10)

			return [
				project_item.id,
				session_rows.map(item =>
					serializeSessionItem({ session_item: item.session, project_id: project_item.id })
				)
			] as const
		})
	)

	return {
		projects,
		sessions: Object.fromEntries(sessions)
	}
})
