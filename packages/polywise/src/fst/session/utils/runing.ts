import { session_status_emitter } from '@core/rpc/session/watchSessionStatus'

import type Index from '../index'

export default async (s: Index, v: boolean) => {
	s.session.is_runing = v

	const session = await s.updateSession({ is_runing: v })

	session_status_emitter.emit('change', {
		[s.id]: {
			title: session.title,
			running: session.is_runing,
			unread: session.unread ?? false
		}
	})
}
