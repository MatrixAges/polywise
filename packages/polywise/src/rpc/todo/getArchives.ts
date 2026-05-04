import { getTodos } from '@core/db/services'
import { p } from '@core/utils'
import { asc, desc, eq } from 'drizzle-orm'

import { todo } from '../../db/schema'

const page_size = 10

export default p.query(async () => {
	const rows = await getTodos({
		where: eq(todo.status, 'archive'),
		orderBy: [desc(todo.created_at), asc(todo.order)],
		limit: page_size + 1
	})

	const has_more = rows.length > page_size
	const items = has_more ? rows.slice(0, page_size) : rows

	return {
		items,
		has_more
	}
})
