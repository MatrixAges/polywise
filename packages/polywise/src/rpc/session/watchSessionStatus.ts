import events from 'events'
import { p } from '@core/utils'

export interface SessionStatusPayload {
	[id: string]: {
		title: string
		running: boolean
		unread: boolean
		running_since: number | null
		running_done: number | null
	}
}

export const session_status_emitter = new events.EventEmitter()

export default p.subscription(async function* (args) {
	const { signal } = args

	try {
		for await (const [data] of events.on(session_status_emitter, 'change', { signal })) {
			yield data as SessionStatusPayload
		}
	} finally {
		session_status_emitter.removeAllListeners()
	}
})
