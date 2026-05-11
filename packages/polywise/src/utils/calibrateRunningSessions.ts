import { session } from '@core/db/schema'
import { syncTodoSessionStatusBySessionId } from '@core/db/services'
import { env } from '@core/env'
import { eq } from 'drizzle-orm'

export default async () => {
	const running_done = new Date()
	const stale_sessions = await env.db
		.update(session)
		.set({ is_runing: false, running_done })
		.where(eq(session.is_runing, true))
		.returning({ id: session.id })

	if (!stale_sessions.length) {
		return
	}

	await Promise.all(
		stale_sessions.map(item =>
			syncTodoSessionStatusBySessionId({
				session_id: item.id,
				from_status_list: ['processing'],
				to_status: 'error'
			})
		)
	)
}
