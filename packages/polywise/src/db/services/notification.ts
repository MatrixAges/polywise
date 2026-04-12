import { notification } from '@core/db/schema'
import { env } from '@core/env'

import type { NotificationInsert } from '@core/db'

export const addNotification = async (values: NotificationInsert) => {
	return env.db
		.insert(notification)
		.values(values)
		.returning()
		.then(res => res[0])
}
