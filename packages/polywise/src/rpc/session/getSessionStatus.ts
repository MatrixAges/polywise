import events from 'events'
import { blocked_session_id } from '@core/consts'
import { session, todo, todo_session } from '@core/db/schema'
import { and, countDistinct, eq } from 'drizzle-orm'

import { env } from '../../env'
import { p } from '../../utils/trpc'

const countRunningSession = async () => {
	const [data] = await env.db
		.select({ total: countDistinct(session.id) })
		.from(session)
		.where(and(eq(session.is_runing, true), eq(session.is_im, false)))

	return data?.total ?? 0
}

const countUnreadSession = async () => {
	const [data] = await env.db
		.select({ total: countDistinct(session.id) })
		.from(session)
		.where(and(eq(session.unread, true), eq(session.is_im, false)))

	return data?.total ?? 0
}

const countErrorSession = async () => {
	const [data] = await env.db
		.select({ total: countDistinct(session.id) })
		.from(todo_session)
		.innerJoin(todo, and(eq(todo.id, todo_session.todo_id), eq(todo.status, 'error')))
		.innerJoin(session, eq(session.id, todo_session.session_id))
		.where(and(eq(session.is_runing, false), eq(session.is_im, false)))

	if (!data?.total) {
		return 0
	}

	const [blocked_data] = await env.db
		.select({ total: countDistinct(session.id) })
		.from(todo_session)
		.innerJoin(todo, and(eq(todo.id, todo_session.todo_id), eq(todo.status, 'error')))
		.innerJoin(session, eq(session.id, todo_session.session_id))
		.where(and(eq(session.is_runing, false), eq(session.is_im, false), eq(session.id, blocked_session_id)))

	return data.total - (blocked_data?.total ?? 0)
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
