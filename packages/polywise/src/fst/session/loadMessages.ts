import { message } from '@core/db/schema'
import { env } from '@core/env'
import { and, desc, eq, gt, lt } from 'drizzle-orm'

import type Index from './index'

const ui_threshold_value = 20
const ui_reduce_value = 10

export default async (s: Index, type: 'prev' | 'next') => {
	const is_older = type === 'prev'

	const has_more = is_older ? s.ui_has_older : s.ui_has_newer

	if (!has_more) return

	const boundary = is_older ? s.ui_messages[0] : s.ui_messages.at(-1)

	if (!boundary?.createdAt) return

	const condition = is_older
		? lt(message.created_at, boundary.createdAt)
		: gt(message.created_at, boundary.createdAt)

	const res = await env.db
		.select()
		.from(message)
		.where(and(eq(message.session_id, s.id), condition))
		.orderBy(desc(message.created_at))
		.limit(ui_reduce_value)

	if (!res.length) {
		if (is_older) {
			s.ui_has_older = false
		} else {
			s.ui_has_newer = false
		}
		return
	}

	const new_messages = res
		.map(item => {
			const parsed = JSON.parse(item.content)
			parsed.createdAt = item.created_at
			return parsed
		})
		.reverse()

	if (is_older) {
		s.ui_messages = [...new_messages, ...s.ui_messages]

		if (s.ui_messages.length > ui_threshold_value) {
			s.ui_messages = s.ui_messages.slice(0, -ui_reduce_value)
			s.ui_has_newer = true
		}
	} else {
		s.ui_messages = [...s.ui_messages, ...new_messages]

		if (s.ui_messages.length > ui_threshold_value) {
			s.ui_messages = s.ui_messages.slice(ui_reduce_value)
			s.ui_has_older = true
		}
	}

	if (is_older) {
		s.ui_has_older = res.length === ui_reduce_value
	} else {
		s.ui_has_newer = res.length === ui_reduce_value
	}
}
