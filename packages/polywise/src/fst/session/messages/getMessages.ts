import { message } from '@core/db/schema'
import { env } from '@core/env'
import { desc, eq, sql } from 'drizzle-orm'

import type Index from '../index'

const ui_threshold_value = 20
const ui_reduce_value = 10

export default async (s: Index) => {
	const res = await env.db
		.select()
		.from(message)
		.where(eq(message.session_id, s.id))
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
		.where(eq(message.session_id, s.id))

	const total = Number(count_row?.count ?? 0)

	s.ui_has_older = total > ui_threshold_value
	s.ui_has_newer = false
}
