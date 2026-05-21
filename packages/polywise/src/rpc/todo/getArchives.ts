import { env } from '@core/env'
import { p } from '@core/utils'
import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm'
import { number, object } from 'zod'

import { todo, todo_session } from '../../db/schema'

const page_size = 10

const input_type = object({ page: number().int().min(1) })

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/todo/getArchives',
			summary: 'Read Get Archives'
		}
	})
	.input(input_type)
	.query(async ({ input }) => {
		const offset = (input.page - 1) * page_size

		const rows = await env.db
			.select()
			.from(todo)
			.leftJoin(todo_session, sql`${todo.id} = ${todo_session.todo_id}`)
			.where(and(eq(todo.status, 'archive'), isNull(todo_session.todo_id)))
			.orderBy(desc(todo.updated_at), asc(todo.order))
			.limit(page_size + 1)
			.offset(offset)
			.then(res => res.map(item => item.todo))

		const has_more = rows.length > page_size
		const items = has_more ? rows.slice(0, page_size) : rows

		return {
			items,
			has_more
		}
	})
