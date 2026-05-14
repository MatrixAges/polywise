import events from 'events'
import { blocked_session_ids } from '@core/consts'
import { session, todo, todo_session } from '@core/db/schema'
import { and, countDistinct, eq, isNull, notInArray, or } from 'drizzle-orm'

import { env } from '../../env'
import { p } from '../../utils/trpc'

const is_non_cron_session = or(isNull(session.is_cron), eq(session.is_cron, false))
const is_non_im_session = or(isNull(session.is_im), eq(session.is_im, false))

const countRunningSession = async () => {
	const [data] = await env.db
		.select({ total: countDistinct(session.id) })
		.from(session)
		.where(
			and(
				eq(session.is_runing, true),
				is_non_cron_session,
				notInArray(session.id, [...blocked_session_ids])
			)
		)

	return data?.total ?? 0
}

const countUnreadSession = async () => {
	const [data] = await env.db
		.select({ total: countDistinct(session.id) })
		.from(session)
		.where(
			and(
				eq(session.unread, true),
				is_non_cron_session,
				is_non_im_session,
				notInArray(session.id, [...blocked_session_ids])
			)
		)

	return data?.total ?? 0
}

const countErrorSession = async () => {
	const [data] = await env.db
		.select({ total: countDistinct(session.id) })
		.from(todo_session)
		.innerJoin(todo, and(eq(todo.id, todo_session.todo_id), eq(todo.status, 'error')))
		.innerJoin(session, eq(session.id, todo_session.session_id))
		.where(and(eq(todo.status, 'error'), notInArray(session.id, [...blocked_session_ids])))

	return data?.total ?? 0
}

const getSessionStatusCount = async () => {
	const [unread, running, error] = await Promise.all([
		countUnreadSession(),
		countRunningSession(),
		countErrorSession()
	])

	return {
		unread,
		running,
		error
	}
}

export const session_count_emitter = new events.EventEmitter()

export default p.subscription(async function* (args) {
	const { signal } = args

	yield await getSessionStatusCount()

	for await (const _ of events.on(session_count_emitter, 'change', { signal })) {
		yield await getSessionStatusCount()
	}
})
