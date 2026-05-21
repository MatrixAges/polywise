import { object, string } from 'zod'

import { p } from '../../utils/trpc'
import { removeLinkcaseItem } from './utils'

const input_type = object({
	id: string()
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/linkcase/remove',
			summary: 'Run Remove'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => removeLinkcaseItem(input.id))
