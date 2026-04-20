import events from 'events'
import { p } from '@core/utils'

export interface SessionTitlePayload {
	id: string
	title: string
}

export const session_title_emitter = new events.EventEmitter()

export default p.subscription(async function* (args) {
	const { signal } = args

	try {
		for await (const [data] of events.on(session_title_emitter, 'change', { signal })) {
			yield data as SessionTitlePayload
		}
	} finally {
		session_title_emitter.removeAllListeners()
	}
})
