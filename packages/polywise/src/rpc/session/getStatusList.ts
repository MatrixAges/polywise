import { blocked_session_ids, isBlockedSessionId } from '@core/consts'
import { session, todo, todo_session } from '@core/db/schema'
import { getSessions } from '@core/db/services'
import { and, desc, eq, inArray, isNull, notInArray, or } from 'drizzle-orm'
import { enum as Enum, object } from 'zod'

import { env } from '../../env'
import { p } from '../../utils/trpc'

import type { Session } from '@core/db'
import type { SessionStatusType } from './types'

const is_non_cron_session = or(isNull(session.is_cron), eq(session.is_cron, false))
const is_non_im_session = or(isNull(session.is_im), eq(session.is_im, false))

export interface SessionStatusItem extends Session {
	status: string | null
}

const getSessionMap = async (session_id_list: Array<string>) => {
	if (!session_id_list.length) {
		return new Map<string, SessionStatusItem>()
	}

	const session_list = await getSessions({
		where: inArray(session.id, session_id_list)
	})

	return new Map(session_list.map(item => [item.id, { ...item, status: null }]))
}

const getErrorSessionMap = async () => {
	const rows = await env.db
		.select({ session, status: todo.status })
		.from(todo_session)
		.innerJoin(todo, and(eq(todo.id, todo_session.todo_id), eq(todo.status, 'error')))
		.innerJoin(session, eq(session.id, todo_session.session_id))
		.orderBy(desc(session.updated_at))

	return new Map(
		rows
			.filter(item => !isBlockedSessionId(item.session.id))
			.map(item => [
				item.session.id,
				{
					...item.session,
					status: item.status
				}
			])
	)
}

const sortSessionList = (session_list: Array<SessionStatusItem>) => {
	return [...session_list].sort((a, b) => (b.updated_at?.getTime() ?? 0) - (a.updated_at?.getTime() ?? 0))
}

const input_type = object({ status: Enum(['running', 'unread', 'error']) })

const getRunningList = async () => {
	const running_list = await getSessions({
		where: and(
			eq(session.is_runing, true),
			is_non_cron_session,
			notInArray(session.id, [...blocked_session_ids])
		),
		orderBy: desc(session.updated_at)
	})
	const running_map = await getSessionMap(running_list.map(item => item.id))

	return sortSessionList(Array.from(running_map.values()))
}

const getUnreadList = async () => {
	const unread_list = await getSessions({
		where: and(
			eq(session.unread, true),
			is_non_cron_session,
			is_non_im_session,
			notInArray(session.id, [...blocked_session_ids])
		),
		orderBy: desc(session.updated_at)
	})
	const unread_map = await getSessionMap(unread_list.map(item => item.id))

	return sortSessionList(Array.from(unread_map.values()))
}

const getStatusList = async (status: SessionStatusType) => {
	if (status === 'running') {
		return getRunningList()
	}

	if (status === 'unread') {
		return getUnreadList()
	}

	return sortSessionList(Array.from((await getErrorSessionMap()).values()))
}

export default p.input(input_type).query(async ({ input }) => {
	return getStatusList(input.status)
})
