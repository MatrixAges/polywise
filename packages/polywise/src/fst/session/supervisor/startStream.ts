import checkStream from './checkStream'
import { streams } from './streams'
import { startTimer } from './timer'

import type { Message } from '../../types'
import type Index from '../index'

export default (session: Index, message: Message) => {
	startTimer(checkStream)

	streams.set(session.id, {
		session,
		start_time: Date.now(),
		last_check_time: Date.now(),
		message,
		recent_parts: [],
		chaos_detected: false
	})
}
