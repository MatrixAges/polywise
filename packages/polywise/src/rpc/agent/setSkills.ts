import { array, object, string } from 'zod'

import { replaceAgentSkills } from '../../db/services/externals'
import { p } from '../../utils/trpc'

const input_type = object({
	agent_id: string(),
	skill_ids: array(string())
})

export default p.input(input_type).mutation(async ({ input }) => {
	return replaceAgentSkills(input)
})
