import { SessionEventStore, SessionStore } from '@core/utils'

const IDLE_TIMEOUT = 120 * 1000
const CHECK_INTERVAL = 30 * 1000

export const initAutoClean = () => {
	setInterval(() => {
		const now = Date.now()

		for (const [id, session] of SessionStore.entries()) {
			if (now - session.update_at > IDLE_TIMEOUT) {
				SessionStore.delete(id)
				SessionEventStore.emit(`${id}/destroy`)
			}
		}
	}, CHECK_INTERVAL)
}
