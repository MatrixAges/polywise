import { object, string, url } from 'zod'

import { p } from '../../utils/trpc'
import { createLinkcaseItem } from './utils'

const input_type = object({
	url: url(),
	title: string().optional(),
	content: string().optional()
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/linkcase/create',
			description: 'Run Create'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		return createLinkcaseItem(input)
	})
