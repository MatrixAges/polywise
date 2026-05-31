import { object, string } from 'zod'

import { p } from '../../utils/trpc'
import { removeLinkcaseSchedule } from './scheduler'

const input_type = object({
	id: string()
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/linkcase/removeSchedule',
			description: 'Delete one linkcase schedule.'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => removeLinkcaseSchedule(input.id))
