import { object, string } from 'zod'

import { p } from '../../utils/trpc'
import { createSkill } from './utils'

const input_type = object({
	name: string(),
	desc: string(),
	content: string(),
	type: string().optional()
})

export default p.input(input_type).mutation(async ({ input }) => {
	return createSkill({
		name: input.name,
		desc: input.desc,
		content: input.content,
		type: input.type
	})
})
