import { blocked_session_ids, isBlockedSessionId } from '@core/consts'
import { session } from '@core/db/schema'
import { getSessions } from '@core/db/services'
import {
	getAgentSessionIdList,
	getGroupSessionIdList,
	getPostSessionIdList,
	getProjectSessionIdList
} from '@core/db/services/externals'
import { and, desc, eq, inArray, isNull, notInArray, or } from 'drizzle-orm'
import { enum as Enum, object } from 'zod'

import { p } from '../../utils/trpc'
import { readPinList } from './utils'

import type { Session } from '@core/db'
import type { SessionPinItem } from './utils'

const session_page_size = 10
const input_type = object({
	kind: Enum(['default', 'im']).optional()
})

const getKindWhere = (kind: 'default' | 'im') =>
	kind === 'im' ? eq(session.is_im, true) : or(isNull(session.is_im), eq(session.is_im, false))

const getPinMap = (pin_list: Array<SessionPinItem>) => {
	return pin_list.reduce(
		(total, item, index) => {
			total[item.id] = index

			return total
		},
		{} as Record<string, number>
	)
}

const getPinSessionList = async (args: {
	kind: 'default' | 'im'
	pin_list: Array<SessionPinItem>
	project_session_id_set: Set<string>
	group_session_id_set: Set<string>
	agent_session_id_set: Set<string>
	post_session_id_set: Set<string>
}) => {
	const {
		kind,
		pin_list,
		project_session_id_set,
		group_session_id_set,
		agent_session_id_set,
		post_session_id_set
	} = args
	const pin_session_id_list = pin_list
		.map(item => item.id)
		.filter(session_id => !project_session_id_set.has(session_id))
		.filter(session_id => (kind === 'im' ? true : !group_session_id_set.has(session_id)))
		.filter(session_id => (kind === 'im' ? true : !agent_session_id_set.has(session_id)))
		.filter(session_id => !post_session_id_set.has(session_id))
		.filter(session_id => !isBlockedSessionId(session_id))

	if (!pin_session_id_list.length) {
		return []
	}

	return getSessions({
		where: and(inArray(session.id, pin_session_id_list), getKindWhere(kind))!
	})
}

const getUnpinSessionList = async (args: {
	kind: 'default' | 'im'
	pin_session_id_list: Array<string>
	project_session_id_list: Array<string>
	group_session_id_list: Array<string>
	agent_session_id_list: Array<string>
	post_session_id_list: Array<string>
}) => {
	const {
		kind,
		pin_session_id_list,
		project_session_id_list,
		group_session_id_list,
		agent_session_id_list,
		post_session_id_list
	} = args
	const exclude_session_id_list = [
		...pin_session_id_list,
		...project_session_id_list,
		...(kind === 'im' ? [] : group_session_id_list),
		...(kind === 'im' ? [] : agent_session_id_list),
		...post_session_id_list,
		...blocked_session_ids
	]

	return getSessions({
		where: and(notInArray(session.id, exclude_session_id_list), getKindWhere(kind))!,
		orderBy: desc(session.created_at),
		limit: session_page_size
	})
}

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/session/getList',
			summary: 'Read Get List'
		}
	})
	.input(input_type)
	.query(async ({ input }) => {
		const kind = input?.kind || 'default'
		const pin_list = (await readPinList()).filter(item => !isBlockedSessionId(item.id))
		const [project_session_id_list, group_session_id_list, agent_session_id_list, post_session_id_list] =
			await Promise.all([
				getProjectSessionIdList(),
				getGroupSessionIdList(),
				getAgentSessionIdList(),
				getPostSessionIdList()
			])
		const project_session_id_set = new Set(project_session_id_list)
		const group_session_id_set = new Set(group_session_id_list)
		const agent_session_id_set = new Set(agent_session_id_list)
		const post_session_id_set = new Set(post_session_id_list)
		const pin_map = getPinMap(pin_list)
		const pin_session_list = await getPinSessionList({
			kind,
			pin_list,
			project_session_id_set,
			group_session_id_set,
			agent_session_id_set,
			post_session_id_set
		})
		const unpin_session_list = await getUnpinSessionList({
			kind,
			pin_session_id_list: pin_session_list.map(item => item.id),
			project_session_id_list,
			group_session_id_list,
			agent_session_id_list,
			post_session_id_list
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
