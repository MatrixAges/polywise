import { session_status_emitter } from '@core/rpc/session/watchSessionStatus'

import type Index from '../index'

export default async (s: Index, v: boolean) => {
	s.session.is_runing = v
	s.running_since = v ? new Date() : null

	const session = await s.updateSession({
		is_runing: v,
		running_since: s.running_since
	})

	await s.setState()

	session_status_emitter.emit('change', {
		[s.id]: {
			title: session.title,
			running: session.is_runing,
			unread: session.unread ?? false,
			running_since: s.running_since?.getTime() ?? null
		}
	})
}
