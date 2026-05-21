import { object, string } from 'zod'

import { p } from '../../utils/trpc'
import { updateSkill } from './utils'

const input_type = object({
	id: string(),
	name: string(),
	desc: string(),
	content: string(),
	type: string().optional()
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/skill/update',
			summary: 'Run Update'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		return updateSkill({
			id: input.id,
			name: input.name,
			desc: input.desc,
			content: input.content,
			type: input.type
		})
	})
