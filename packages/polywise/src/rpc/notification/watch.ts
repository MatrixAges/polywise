import events from 'events'
import { p } from '@core/utils'

import { notification_emitter } from './emitter'

import type { NotificationRefreshPayload } from './emitter'

export default p.subscription(async function* (args) {
	const { signal } = args

	for await (const [data] of events.on(notification_emitter, 'change', { signal })) {
		yield data as NotificationRefreshPayload
	}
})
