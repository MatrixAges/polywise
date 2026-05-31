import { object, string } from 'zod'

import { getAgentSkills } from '../../db/services/externals'
import { p } from '../../utils/trpc'

const input_type = object({ agent_id: string() })

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/agent/getSkills',
			description: 'Return the reusable skills currently assigned to one agent.'
		}
	})
	.input(input_type)
	.query(async ({ input }) => {
		const rows = await getAgentSkills(input.agent_id)

		return rows.map(item => item.skill)
	})
