import { project_session, session } from '@core/db/schema'
import { env } from '@core/env'
import { desc, eq } from 'drizzle-orm'
import { number, object, string } from 'zod'

import { p } from '../../utils/trpc'

import type { IProjectMoreSessionsData } from './types'

const serializeSessionItem = (args: { session_item: typeof session.$inferSelect; project_id: string }) => {
	const { session_item, project_id } = args

	return {
		...session_item,
		created_at: session_item.created_at ? session_item.created_at.toISOString() : null,
		updated_at: session_item.updated_at ? session_item.updated_at.toISOString() : null,
		project_id
	}
}

const input_type = object({ project_id: string(), page: number().int().min(1) })

const page_size = 10

export default p.input(input_type).query(async ({ input }) => {
	const session_rows = await env.db
		.select({ session })
		.from(project_session)
		.innerJoin(session, eq(project_session.session_id, session.id))
		.where(eq(project_session.project_id, input.project_id))
		.orderBy(desc(project_session.created_at))
		.limit(page_size)
		.offset((input.page - 1) * page_size)

	return {
		sessions: session_rows.map(item =>
			serializeSessionItem({ session_item: item.session, project_id: input.project_id })
		),
		has_more: session_rows.length >= page_size
	} satisfies IProjectMoreSessionsData
})
