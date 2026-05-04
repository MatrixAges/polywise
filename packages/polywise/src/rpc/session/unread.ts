import { session } from '@core/db/schema'
import { getSession, setSession } from '@core/db/services'
import { p, SessionStore } from '@core/utils'
import { eq } from 'drizzle-orm'
import { object, string } from 'zod'

import { session_status_emitter } from './watchSessionStatus'

const input_type = string()

export default p.input(input_type).mutation(async ({ input }) => {
	const target_live_session = SessionStore.get(input)
	let next_session: null | Awaited<ReturnType<typeof setSession>> = null

	if (target_live_session) {
		next_session = await target_live_session.updateSession({ unread: false })
	} else {
		const target_session = await getSession(eq(session.id, input))

		if (!target_session) {
			return null
		}

		next_session = await setSession(eq(session.id, input), { unread: false })
	}

	if (next_session) {
		const running_since = target_live_session?.running_since ?? next_session.running_since ?? null

		session_status_emitter.emit('change', {
			[input]: {
				title: next_session.title,
				running: next_session.is_runing,
				unread: next_session.unread ?? false,
				running_since: running_since?.getTime() ?? null
			}
		})
	}

	return next_session
})
