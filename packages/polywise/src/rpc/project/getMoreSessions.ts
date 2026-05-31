import { number, object, string } from 'zod'

import { getProjectSessions } from '../../db/services'
import { p } from '../../utils/trpc'

const page_size = 6

const input_type = object({ project_id: string(), page: number().int().min(1) })

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/project/getMoreSessions',
			description: 'Load more sessions linked to one project.'
		}
	})
	.input(input_type)
	.query(async ({ input }) => {
		const session_rows = await getProjectSessions({
			project_id: input.project_id,
			limit: page_size + 1,
			offset: (input.page - 1) * page_size
		})

		const has_more = session_rows.length > page_size
		const sessions = has_more ? session_rows.slice(0, page_size) : session_rows

		return {
			sessions: sessions.map(item => item.session),
			has_more
		}
	})
