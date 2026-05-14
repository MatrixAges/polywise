import { blocked_session_ids, isBlockedSessionId } from '@core/consts'
import { session } from '@core/db/schema'
import { getSessions } from '@core/db/services'
import { getAgentSessionIdList, getProjectSessionIdList } from '@core/db/services/externals'
import { desc, inArray, notInArray } from 'drizzle-orm'

import { p } from '../../utils/trpc'
import { readPinList } from './utils'

import type { Session } from '@core/db'
import type { SessionPinItem } from './utils'

const session_page_size = 10

const getPinMap = (pin_list: Array<SessionPinItem>) => {
	return pin_list.reduce(
		(total, item) => {
			total[item.id] = item.pin_at

			return total
		},
		{} as Record<string, number>
	)
}

const getPinSessionList = async (args: {
	pin_list: Array<SessionPinItem>
	project_session_id_set: Set<string>
	agent_session_id_set: Set<string>
}) => {
	const { pin_list, project_session_id_set, agent_session_id_set } = args
	const pin_session_id_list = pin_list
		.map(item => item.id)
		.filter(session_id => !project_session_id_set.has(session_id))
		.filter(session_id => !agent_session_id_set.has(session_id))
		.filter(session_id => !isBlockedSessionId(session_id))

	if (!pin_session_id_list.length) {
		return []
	}

	return getSessions({ where: inArray(session.id, pin_session_id_list) })
}

const getUnpinSessionList = async (args: {
	pin_session_id_list: Array<string>
	project_session_id_list: Array<string>
	agent_session_id_list: Array<string>
}) => {
	const { pin_session_id_list, project_session_id_list, agent_session_id_list } = args
	const exclude_session_id_list = [
		...pin_session_id_list,
		...project_session_id_list,
		...agent_session_id_list,
		...blocked_session_ids
	]

	return getSessions({
		where: notInArray(session.id, exclude_session_id_list),
		orderBy: desc(session.created_at),
		limit: session_page_size
	})
}

export default p.query(async () => {
	const pin_list = (await readPinList()).filter(item => !isBlockedSessionId(item.id))
	const [project_session_id_list, agent_session_id_list] = await Promise.all([
		getProjectSessionIdList(),
		getAgentSessionIdList()
	])
	const project_session_id_set = new Set(project_session_id_list)
	const agent_session_id_set = new Set(agent_session_id_list)
	const pin_map = getPinMap(pin_list)
	const pin_session_list = await getPinSessionList({ pin_list, project_session_id_set, agent_session_id_set })
	const unpin_session_list = await getUnpinSessionList({
		pin_session_id_list: pin_session_list.map(item => item.id),
		project_session_id_list,
		agent_session_id_list
	})
	const pin_session_map = new Map(pin_session_list.map(item => [item.id, item]))
	const pins = pin_list
		.map(item => pin_session_map.get(item.id))
		.filter((target_session): target_session is Session => Boolean(target_session))

	return {
		pins,
		sessions: unpin_session_list,
		pin_map,
		has_more: unpin_session_list.length >= session_page_size
	}
})
