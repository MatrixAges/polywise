import { session } from '@core/db/schema'
import { getSessions } from '@core/db/services'
import { desc, inArray, notInArray } from 'drizzle-orm'

import { p } from '../../utils/trpc'
import { readGroupList } from './utils'

import type { Session } from '@core/db'

const session_page_size = 10

const getGroupSessionIdList = (group_list: Array<{ items: Array<string> }>) => {
	return group_list.flatMap(item => item.items)
}

const getGroupSessionMap = async (group_session_id_list: Array<string>) => {
	if (!group_session_id_list.length) {
		return new Map<string, Session>()
	}

	const group_session_list = await getSessions({
		where: inArray(session.id, group_session_id_list)
	})

	return new Map(group_session_list.map(item => [item.id, item]))
}

const getSessionList = async (group_session_id_list: Array<string>) => {
	return getSessions({
		where: group_session_id_list.length ? notInArray(session.id, group_session_id_list) : undefined,
		orderBy: desc(session.created_at),
		limit: session_page_size
	})
}

export default p.query(async () => {
	const group_list = await readGroupList()
	const group_session_id_list = getGroupSessionIdList(group_list)
	const group_session_map = await getGroupSessionMap(group_session_id_list)
	const sessions = await getSessionList(group_session_id_list)
	const groups = group_list.map(item => ({
		group: item.name,
		created_at: item.created_at,
		updated_at: item.updated_at,
		items: item.items
			.map(session_id => group_session_map.get(session_id))
			.filter((target_session): target_session is Session => Boolean(target_session))
	}))

	return {
		groups,
		sessions
	}
})
