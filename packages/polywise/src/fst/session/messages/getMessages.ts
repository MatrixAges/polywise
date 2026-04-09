import { message } from '@core/db/schema'
import { env } from '@core/env'
import { and, desc, eq, gt, sql } from 'drizzle-orm'

import type Index from '../index'

const ui_threshold_value = 20
const ui_reduce_value = 10

export default async (s: Index) => {
	const archived_condition =
		typeof s.archived_at === 'number' ? gt(message.created_at, new Date(s.archived_at)) : undefined

	const where_condition = archived_condition
		? and(eq(message.session_id, s.id), archived_condition)
		: eq(message.session_id, s.id)

	const res = await env.db
		.select()
		.from(message)
		.where(where_condition)
		.orderBy(desc(message.created_at))
		.limit(ui_threshold_value)

	s.ui_messages = res
		.map(item => {
			const parsed = JSON.parse(item.content)

			parsed.createdAt = item.created_at

			return parsed
		})
		.reverse()

	s.model_messages = s.ui_messages.slice(-ui_reduce_value)

	const [count_row] = await env.db
		.select({ count: sql<number>`count(*)`.as('count') })
		.from(message)
		.where(where_condition)

	const total = Number(count_row?.count ?? 0)

	s.ui_has_older = total > ui_threshold_value
	s.ui_has_newer = false
}
