import { boolean, object, string } from 'zod'

import { p } from '../../utils/trpc'
import { extractPostArticle } from './utils'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/post/extract',
			description: 'Extract structured content or article data for one post.'
		}
	})
	.input(
		object({
			id: string(),
			force: boolean().optional()
		})
	)
	.mutation(async ({ input }) => extractPostArticle(input))
