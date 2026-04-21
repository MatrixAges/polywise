import { session_status_emitter } from '@core/rpc/session/watchSessionStatus'

import type Index from '../index'

export default async (s: Index, v: boolean) => {
	s.session.is_runing = v

	const next_session = await s.updateSession({ is_runing: v })

	if (next_session) {
		session_status_emitter.emit('change', {
			[s.id]: {
				title: next_session.title,
				running: next_session.is_runing,
				unread: next_session.unread ?? false
			}
		})
	}
}
