import { project_session, session } from '@core/db/schema'
import { env } from '@core/env'
import { desc, eq } from 'drizzle-orm'
import { number, object, string } from 'zod'

import { p } from '../../utils/trpc'

const page_size = 10

const input_type = object({ project_id: string(), page: number().int().min(1) })

export default p.input(input_type).query(async ({ input }) => {
	const sessions = await env.db
		.select({ session })
		.from(project_session)
		.innerJoin(session, eq(project_session.session_id, session.id))
		.where(eq(project_session.project_id, input.project_id))
		.orderBy(desc(project_session.created_at))
		.limit(page_size)
		.offset((input.page - 1) * page_size)

	return {
		sessions,
		has_more: sessions.length >= page_size
	}
})
