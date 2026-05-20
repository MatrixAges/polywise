import { blocked_session_ids } from '@core/consts'
import { session } from '@core/db/schema'
import { getSessions } from '@core/db/services'
import {
	getAgentSessionIdList,
	getGroupSessionIdList,
	getPostSessionIdList,
	getProjectSessionIdList
} from '@core/db/services/externals'
import { and, desc, eq, isNull, notInArray, or } from 'drizzle-orm'
import { enum as Enum, number, object } from 'zod'

import { p } from '../../utils/trpc'
import { readPinList } from './utils'

const input_type = object({
	page: number().int().min(0),
	kind: Enum(['default', 'im']).optional()
})

const session_page_size = 10
const getKindWhere = (kind: 'default' | 'im') =>
	kind === 'im' ? eq(session.is_im, true) : or(isNull(session.is_im), eq(session.is_im, false))

export default p.input(input_type).query(async ({ input }) => {
	const kind = input.kind || 'default'
	const pin_list = await readPinList()
	const [project_session_id_list, group_session_id_list, agent_session_id_list, post_session_id_list] =
		await Promise.all([
			getProjectSessionIdList(),
			getGroupSessionIdList(),
			getAgentSessionIdList(),
			getPostSessionIdList()
		])
	const pin_session_id_list = pin_list.map(item => item.id)
	const exclude_session_id_list = [
		...pin_session_id_list,
		...project_session_id_list,
		...group_session_id_list,
		...agent_session_id_list,
		...post_session_id_list,
		...blocked_session_ids
	]

	return getSessions({
		where: exclude_session_id_list.length
			? and(notInArray(session.id, exclude_session_id_list), getKindWhere(kind))!
			: getKindWhere(kind),
		orderBy: desc(session.created_at),
		limit: session_page_size,
		offset: input.page * session_page_size
	})
})
