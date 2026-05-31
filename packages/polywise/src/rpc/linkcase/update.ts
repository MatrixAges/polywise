import { object, string, url } from 'zod'

import { p } from '../../utils/trpc'
import { updateLinkcaseItem } from './utils'

const input_type = object({
	id: string(),
	url: url(),
	title: string().optional(),
	content: string().optional()
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/linkcase/update',
			description: 'Update one linkcase item URL, title, or stored content.'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		return updateLinkcaseItem(input)
	})
