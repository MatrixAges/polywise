import events from 'events'

export interface NotificationRefreshPayload {
	updated_at: number
}

export const notification_emitter = new events.EventEmitter()

export const emitNotificationRefresh = () => {
	notification_emitter.emit('change', { updated_at: Date.now() } satisfies NotificationRefreshPayload)
}
