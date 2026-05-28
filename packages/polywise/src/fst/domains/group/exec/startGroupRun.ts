import { getId } from 'stk/utils'

import type Session from '../../../session'

export default async (s: Session) => {
	s.active_turn_id = getId()
	s.reply_queue = []

	await s.setRunning(true)
	await s.setState()
	s.sync()

	return s.active_turn_id!
}
