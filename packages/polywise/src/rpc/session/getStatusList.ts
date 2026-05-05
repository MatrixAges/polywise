import { blocked_session_id } from '@core/consts'
import { session, todo, todo_session } from '@core/db/schema'
import { getSessions } from '@core/db/services'
import { and, desc, eq, inArray } from 'drizzle-orm'

import { env } from '../../env'
import { p } from '../../utils/trpc'

import type { Session } from '@core/db'

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
		.where(eq(session.is_runing, false))
		.orderBy(desc(session.updated_at))

	return new Map(
		rows
			.filter(item => item.session.id !== blocked_session_id)
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

export default p.query(async () => {
	const running_list = await getSessions({
		where: and(eq(session.is_runing, true), eq(session.is_im, false)),
		orderBy: desc(session.updated_at)
	})
	const unread_list = await getSessions({
		where: and(eq(session.unread, true), eq(session.is_im, false)),
		orderBy: desc(session.updated_at)
	})
	const running_map = await getSessionMap(
		running_list.map(item => item.id).filter(session_id => session_id !== blocked_session_id)
	)
	const unread_map = await getSessionMap(
		unread_list.map(item => item.id).filter(session_id => session_id !== blocked_session_id)
	)
	const error_map = await getErrorSessionMap()

	return {
		running: sortSessionList(Array.from(running_map.values())),
		unread: sortSessionList(Array.from(unread_map.values())),
		error: sortSessionList(Array.from(error_map.values()))
	}
})
