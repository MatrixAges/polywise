import { session_todo, todo } from '@core/db/schema'
import { getSessionTodos } from '@core/db/services'
import { and, asc, eq, ne, sql } from 'drizzle-orm'

import type { Context } from '../../types'
import type Index from '../index'

export default async (s: Index) => {
	const res = await getSessionTodos({
		where: and(eq(session_todo.session_id, s.id), ne(todo.status, 'archive')),
		orderBy: [
			sql`CASE ${todo.status} WHEN 'draft' THEN 0 WHEN 'pending' THEN 1 WHEN 'processing' THEN 2 WHEN 'done' THEN 3 WHEN 'error' THEN 4 END`,
			asc(todo.order)
		]
	})

	s.context.tasks = res.map(item => {
		const t = item.todo

		return {
			title: t.title,
			desc: t.description ?? '',
			status: t.status,
			result: t.result ?? undefined,
			error: t.error ?? undefined
		} as Required<Context>['tasks'][number]
	})
}
