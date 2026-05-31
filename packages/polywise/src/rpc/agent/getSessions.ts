import { number, object, string } from 'zod'

import { getAgentSessions } from '../../db/services/externals'
import { p } from '../../utils/trpc'
import { readPinList } from './utils'

import type { Session } from '@core/db'
import type { AgentSessionPinItem } from './utils'

const page_size = 10

const input_type = object({
	agent_id: string(),
	page: number().int().min(1)
})

const getPinMap = (pin_list: Array<AgentSessionPinItem>) => {
	return pin_list.reduce(
		(total, item) => {
			total[item.id] = item.pin_at

			return total
		},
		{} as Record<string, number>
	)
}

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/agent/getSessions',
			description:
				'Return pinned and paginated chat sessions associated with one agent, including pin state and pagination.'
		}
	})
	.input(input_type)
	.query(async ({ input }) => {
		const pin_list = await readPinList(input.agent_id)
		const pin_map = getPinMap(pin_list)
		const pin_session_id_list = pin_list.map(item => item.id)
		const [pin_rows, session_rows] = await Promise.all([
			pin_session_id_list.length
				? getAgentSessions({
						agent_id: input.agent_id,
						session_ids: pin_session_id_list
					})
				: Promise.resolve([]),
			getAgentSessions({
				agent_id: input.agent_id,
				exclude_session_ids: pin_session_id_list,
				limit: page_size + 1,
				offset: (input.page - 1) * page_size
			})
		])

		const has_more = session_rows.length > page_size
		const sessions = has_more ? session_rows.slice(0, page_size) : session_rows
		const pin_session_map = new Map(pin_rows.map(item => [item.session.id, item.session]))
		const pins = pin_list
			.map(item => pin_session_map.get(item.id))
			.filter((target_session): target_session is Session => Boolean(target_session))

		return {
			pins,
			sessions: sessions.map(item => item.session),
			pin_map,
			has_more
		}
	})
