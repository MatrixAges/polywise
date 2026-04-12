import { notification_session } from '@core/db/schema'
import { env } from '@core/env'

export const addNotificationSession = async (notification_id: string, session_id: string) => {
	return env.db
		.insert(notification_session)
		.values({ notification_id, session_id })
		.returning()
		.then(res => res[0])
}
