import { message } from '@core/db/schema'
import { getMessages, getMessagesCount } from '@core/db/services'
import { and, desc, eq, gt } from 'drizzle-orm'

import type Index from '../index'

const ui_threshold_value = 20
const ui_reduce_value = 10

export default async (s: Index) => {
	const archived_condition =
		typeof s.archived_at === 'number' ? gt(message.created_at, new Date(s.archived_at)) : undefined

	const where_condition = archived_condition
		? and(eq(message.session_id, s.id), archived_condition)
		: eq(message.session_id, s.id)

	const res = await getMessages({
		where: where_condition,
		orderBy: desc(message.created_at),
		limit: ui_threshold_value
	})

	s.ui_messages = res
		.map(item => {
			const parsed = JSON.parse(item.content)

			parsed.createdAt = item.created_at

			return parsed
		})
		.reverse()

	s.model_messages = s.ui_messages.slice(-ui_reduce_value)

	const total = await getMessagesCount(where_condition)

	s.ui_has_older = total > ui_threshold_value
	s.ui_has_newer = false
}
