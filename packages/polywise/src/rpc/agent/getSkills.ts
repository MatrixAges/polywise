import { object, string } from 'zod'

import { getAgentSkills } from '../../db/services/externals'
import { p } from '../../utils/trpc'

const input_type = object({ agent_id: string() })

export default p.input(input_type).query(async ({ input }) => {
	const rows = await getAgentSkills(input.agent_id)

	return rows.map(item => item.skill)
})
