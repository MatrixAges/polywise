import { object, string } from 'zod'

import { p } from '../../utils/trpc'
import { removeSkillItem } from './utils'

const input_type = object({ id: string() })

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/skill/remove',
			description: 'Run Remove'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		return removeSkillItem(input.id)
	})
