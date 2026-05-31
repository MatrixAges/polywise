import { assertAgentWritableForBehavior } from '@core/db/services'
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
			description: 'Replace the full set of skills assigned to one agent.'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		await assertAgentWritableForBehavior(input.agent_id)

		return replaceAgentSkills(input)
	})
