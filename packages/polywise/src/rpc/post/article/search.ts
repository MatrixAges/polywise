import { number, object, string } from 'zod'

import { p } from '../../../utils/trpc'
import { getPostById, searchRelatedArticleCandidates } from '../utils'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/post/article/search',
			description: 'Search global articles that can be related to a post.'
		}
	})
	.input(
		object({
			post_id: string(),
			query: string(),
			page: number().int().min(1).default(1)
		})
	)
	.query(async ({ input }) => {
		const post = await getPostById(input.post_id)

		if (!post) {
			throw new Error(`Post not found: ${input.post_id}`)
		}

		return searchRelatedArticleCandidates(input)
	})
