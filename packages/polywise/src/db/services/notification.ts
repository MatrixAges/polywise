import { notification } from '@core/db/schema'
import { env } from '@core/env'
import { emitNotificationRefresh } from '@core/rpc/notification/emitter'

import type { NotificationInsert } from '@core/db'

export const addNotification = async (values: NotificationInsert) => {
	const item = await env.db
		.insert(notification)
		.values(values)
		.returning()
		.then(res => res[0])

	emitNotificationRefresh()

	return item
}
