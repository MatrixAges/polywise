import { session_count_emitter } from '@core/rpc/session/getSessionStatus'
import getSessionStatusPayload from '@core/rpc/session/getSessionStatusPayload'
import { session_status_emitter } from '@core/rpc/session/watchSessionStatus'

import type { Session } from '@core/db'

const emitChange = async (args: { session: Session; running_since?: Date | null; running_done?: Date | null }) => {
	const { session } = args
	const running_since = 'running_since' in args ? (args.running_since ?? null) : (session.running_since ?? null)
	const running_done = 'running_done' in args ? (args.running_done ?? null) : (session.running_done ?? null)

	const status_payload = await getSessionStatusPayload({
		session,
		running_since,
		running_done
	})

	session_status_emitter.emit('change', {
		[session.id]: status_payload
	})

	session_count_emitter.emit('change')
}

export default emitChange
