import { group_session } from '@core/db/schema'
import { getGroupSessions } from '@core/db/services'
import { eq } from 'drizzle-orm'
import { string } from 'zod'

import { p } from '../../utils/trpc'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/group/getSessions',
			description: 'List chat sessions linked to a group.'
		}
	})
	.input(string())
	.query(async ({ input }) => {
		const res = await getGroupSessions({
			where: eq(group_session.group_id, input)
		})

		return res.map(item => item.session)
	})
