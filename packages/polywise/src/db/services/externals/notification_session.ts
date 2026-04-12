import { notification_session } from '@core/db/schema'
import { env } from '@core/env'

export async function addNotificationSession(notification_id: string, session_id: string) {
	const [res] = await env.db.insert(notification_session).values({ notification_id, session_id }).returning()
	return res
}
