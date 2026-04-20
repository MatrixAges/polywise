import { session } from '@core/db/schema'
import { getSessions } from '@core/db/services'
import { desc, inArray, notInArray } from 'drizzle-orm'

import { p } from '../../utils/trpc'
import { readGroupList, readPinList } from './utils'

import type { Session } from '@core/db'
import type { SessionPinItem } from './utils'

const session_page_size = 10

const getGroupSessionIdList = (group_list: Array<{ items: Array<string> }>) => {
	return group_list.flatMap(item => item.items)
}

const getPinMap = (pin_list: Array<SessionPinItem>) => {
	return pin_list.reduce(
		(total, item) => {
			total[item.id] = item.pin_at

			return total
		},
		{} as Record<string, number>
	)
}

const sortByPinAt = (args: { list: Array<Session>; pin_map: Record<string, number> }) => {
	const { list, pin_map } = args

	return [...list].sort((a, b) => {
		const a_pin_at = pin_map[a.id] || 0
		const b_pin_at = pin_map[b.id] || 0

		if (!a_pin_at && !b_pin_at) {
			return 0
		}

		if (!a_pin_at) {
			return 1
		}

		if (!b_pin_at) {
			return -1
		}

		return b_pin_at - a_pin_at
	})
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

const getPinSessionList = async (pin_list: Array<SessionPinItem>, group_session_id_list: Array<string>) => {
	const group_session_id_set = new Set(group_session_id_list)
	const pin_session_id_list = pin_list
		.map(item => item.id)
		.filter(session_id => !group_session_id_set.has(session_id))

	if (!pin_session_id_list.length) {
		return []
	}

	return getSessions({ where: inArray(session.id, pin_session_id_list) })
}

const getUnpinSessionList = async (args: {
	group_session_id_list: Array<string>
	pin_session_id_list: Array<string>
}) => {
	const { group_session_id_list, pin_session_id_list } = args
	const exclude_session_id_list = [...group_session_id_list, ...pin_session_id_list]

	return getSessions({
		where: exclude_session_id_list.length ? notInArray(session.id, exclude_session_id_list) : undefined,
		orderBy: desc(session.created_at),
		limit: session_page_size
	})
}

export default p.query(async () => {
	const group_list = await readGroupList()
	const pin_list = await readPinList()

	const pin_map = getPinMap(pin_list)

	const group_session_id_list = getGroupSessionIdList(group_list)

	const group_session_map = await getGroupSessionMap(group_session_id_list)
	const pin_session_list = await getPinSessionList(pin_list, group_session_id_list)
	const unpin_session_list = await getUnpinSessionList({
		group_session_id_list,
		pin_session_id_list: pin_session_list.map(item => item.id)
	})
	const pin_session_map = new Map(pin_session_list.map(item => [item.id, item]))
	const sorted_pin_session_list = pin_list
		.map(item => pin_session_map.get(item.id))
		.filter((target_session): target_session is Session => Boolean(target_session))

	const sessions = [...sorted_pin_session_list, ...unpin_session_list]

	const groups = group_list.map(item => ({
		group: item.name,
		created_at: item.created_at,
		updated_at: item.updated_at,
		items: sortByPinAt({
			list: item.items
				.map(session_id => group_session_map.get(session_id))
				.filter((target_session): target_session is Session => Boolean(target_session)),
			pin_map
		})
	}))

	return {
		groups,
		sessions,
		pin_map,
		has_more: unpin_session_list.length >= session_page_size
	}
})
