import { getTodos } from '@core/db/services'
import { p } from '@core/utils'
import { asc, desc, eq } from 'drizzle-orm'
import { number, object } from 'zod'

import { todo } from '../../db/schema'

const page_size = 10

const input_type = object({ page: number().int().min(0) })

export default p.input(input_type).query(async ({ input }) => {
	const offset = input.page * page_size

	const rows = await getTodos({
		where: eq(todo.status, 'archive'),
		orderBy: [desc(todo.created_at), asc(todo.order)],
		limit: page_size + 1,
		offset
	})

	const has_more = rows.length > page_size
	const items = has_more ? rows.slice(0, page_size) : rows

	return {
		items,
		has_more
	}
})
