import { group_todo } from '@core/db/schema'
import { getGroupTodos } from '@core/db/services'
import { asc, eq } from 'drizzle-orm'
import { string } from 'zod'

import { p } from '../../../utils/trpc'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/group/todo/query',
			summary: 'Read Query'
		}
	})
	.input(string())
	.query(async ({ input }) => {
		return getGroupTodos({
			where: eq(group_todo.group_id, input),
			orderBy: [asc(group_todo.order), asc(group_todo.created_at)]
		})
	})
