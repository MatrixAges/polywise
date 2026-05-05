import { session } from '@core/db/schema'
import { getSession, setSession, syncTodoSessionStatusBySessionId } from '@core/db/services'
import { p, SessionStore } from '@core/utils'
import { eq } from 'drizzle-orm'
import { string } from 'zod'

import { emitChange } from '../../fst/utils'

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
		await syncTodoSessionStatusBySessionId({
			session_id: input,
			from_status_list: ['unreview'],
			to_status: 'done'
		})

		const running_since = target_live_session?.running_since ?? next_session.running_since ?? null
		await emitChange({
			session: next_session,
			running_since,
			running_done: next_session.running_done ?? null
		})
	}

	return next_session
})
