import { session_status_emitter } from '@core/rpc/session/watchSessionStatus'

import getSessionStatusPayload from '../../../rpc/session/getSessionStatusPayload'

import type { SessionInsert } from '@core/db'
import type Index from '../index'

export default async (s: Index, v: boolean) => {
	s.session.is_runing = v
	s.running_since = v ? new Date() : null

	const data = { is_runing: v } as SessionInsert

	if (v) {
		s.running_since = new Date()

		data['running_since'] = s.running_since
	} else {
		data['running_done'] = new Date()
	}

	const session = await s.updateSession(data)

	await s.setState()
	const status_payload = await getSessionStatusPayload({ session, running_since: s.running_since })

	session_status_emitter.emit('change', {
		[s.id]: status_payload
	})
}
