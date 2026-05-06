import { number, object, string } from 'zod'

import { getAgentSessions } from '../../db/services/externals'
import { p } from '../../utils/trpc'

const page_size = 10

const input_type = object({
	agent_id: string(),
	page: number().int().min(1)
})

export default p.input(input_type).query(async ({ input }) => {
	const session_rows = await getAgentSessions({
		agent_id: input.agent_id,
		limit: page_size + 1,
		offset: (input.page - 1) * page_size
	})

	const has_more = session_rows.length > page_size
	const sessions = has_more ? session_rows.slice(0, page_size) : session_rows

	return {
		sessions: sessions.map(item => item.session),
		has_more
	}
})
