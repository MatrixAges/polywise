import { emitChange } from '../../utils'

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
	await emitChange({
		session,
		running_since: s.running_since,
		running_done: session.running_done ?? null
	})
}
