import { message } from '@core/db/schema'
import { removeMessages } from '@core/db/services'
import { and, eq, gt } from 'drizzle-orm'

import type Index from '../index'

export default async (s: Index, message_id: string) => {
	if (s.session.is_runing) return

	const archived_condition =
		typeof s.archived_at === 'number' ? gt(message.created_at, new Date(s.archived_at)) : undefined

	const where_condition = archived_condition
		? and(eq(message.session_id, s.id), eq(message.id, message_id), archived_condition)
		: and(eq(message.session_id, s.id), eq(message.id, message_id))

	const removed = await removeMessages(where_condition)

	if (!removed.length) return

	await s.getMessages()

	s.sync()
}
