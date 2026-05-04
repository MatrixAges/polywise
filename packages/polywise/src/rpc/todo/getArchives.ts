import { getProjectTodo, getStandaloneTodos } from '@core/db/services'
import { p } from '@core/utils'
import { and, asc, desc, eq } from 'drizzle-orm'
import { object, string } from 'zod'

import { project_todo, todo } from '../../db/schema'

const page_size = 10

const input_type = object({ type: string() })

export default p.input(input_type).query(async ({ input }) => {
	if (input.type !== 'inbox') {
		const rows = await getProjectTodo({
			where: and(eq(project_todo.project_id, input.type), eq(todo.status, 'archive')),
			orderBy: [desc(todo.created_at), asc(todo.order)],
			limit: page_size + 1
		})

		const has_more = rows.length > page_size
		const items = has_more ? rows.slice(0, page_size) : rows

		return {
			items: items.map(item => item.todo),
			has_more
		}
	}

	const rows = await getStandaloneTodos({
		where: eq(todo.status, 'archive'),
		orderBy: [desc(todo.created_at), asc(todo.order)],
		limit: page_size + 1
	})

	const has_more = rows.length > page_size
	const items = has_more ? rows.slice(0, page_size) : rows

	return {
		items: items.map(item => item.todo),
		has_more
	}
})
