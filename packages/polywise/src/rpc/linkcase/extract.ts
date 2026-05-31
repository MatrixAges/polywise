import { boolean, object, string } from 'zod'

import { p } from '../../utils/trpc'
import { extractLinkcaseArticle } from './utils'

const input_type = object({
	id: string(),
	force: boolean().optional()
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/linkcase/extract',
			description: 'Run Extract'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => extractLinkcaseArticle(input))
