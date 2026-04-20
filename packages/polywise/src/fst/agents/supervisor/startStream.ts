import checkStream from './checkStream'
import { streams } from './streams'
import { startTimer } from './timer'

import type Index from '../../session'
import type { Message } from '../../types'

export default (session: Index, message: Message) => {
	startTimer(checkStream)

	streams.set(session.id, {
		session,
		start_time: Date.now(),
		last_check_time: Date.now(),
		message,
		pending_text: '',
		recent_parts: [],
		chaos_detected: false
	})
}
