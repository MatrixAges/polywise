import { notification, notification_session, session } from '@core/db/schema'
import { env } from '@core/env'
import { p } from '@core/utils'
import { desc, eq } from 'drizzle-orm'

export interface NotificationItem {
	id: string
	title: string
	description: string | null
	is_read: boolean
	is_pushed: boolean
	created_at: Date | null
	updated_at: Date | null
	session_id: string | null
	session_title: string | null
}

export default p.query(async () => {
	const rows = await env.db
		.select({
			notification,
			session
		})
		.from(notification)
		.leftJoin(notification_session, eq(notification.id, notification_session.notification_id))
		.leftJoin(session, eq(notification_session.session_id, session.id))
		.orderBy(desc(notification.created_at))

	const map = new Map<string, NotificationItem>()

	for (const row of rows) {
		if (map.has(row.notification.id)) continue

		map.set(row.notification.id, {
			id: row.notification.id,
			title: row.notification.title,
			description: row.notification.description ?? null,
			is_read: row.notification.is_read,
			is_pushed: row.notification.is_pushed,
			created_at: row.notification.created_at,
			updated_at: row.notification.updated_at,
			session_id: row.session?.id ?? null,
			session_title: row.session?.title ?? null
		})
	}

	return Array.from(map.values())
})
