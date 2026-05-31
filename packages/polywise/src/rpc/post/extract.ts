import { boolean, object, string } from 'zod'

import { p } from '../../utils/trpc'
import { extractPostArticle } from './utils'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/post/extract',
			description: 'Run Extract'
		}
	})
	.input(
		object({
			id: string(),
			force: boolean().optional()
		})
	)
	.mutation(async ({ input }) => extractPostArticle(input))
