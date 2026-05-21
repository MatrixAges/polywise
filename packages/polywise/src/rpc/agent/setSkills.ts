import { array, object, string } from 'zod'

import { replaceAgentSkills } from '../../db/services/externals'
import { p } from '../../utils/trpc'

const input_type = object({
	agent_id: string(),
	skill_ids: array(string())
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/agent/setSkills',
			summary: 'Run Set Skills'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		return replaceAgentSkills(input)
	})
