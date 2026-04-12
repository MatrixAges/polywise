import { notification } from '@core/db/schema'
import { env } from '@core/env'

import type { NotificationInsert } from '@core/db'

export async function addNotification(values: NotificationInsert) {
	const [res] = await env.db.insert(notification).values(values).returning()
	return res
}
