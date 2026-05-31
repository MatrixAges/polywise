import { object, string } from 'zod'

import { p } from '../../../utils/trpc'
import { getPostById, listPostRelatedArticles } from '../utils'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/post/article/query',
			description: 'List articles currently related to a post.'
		}
	})
	.input(object({ post_id: string() }))
	.query(async ({ input }) => {
		const post = await getPostById(input.post_id)

		if (!post) {
			throw new Error(`Post not found: ${input.post_id}`)
		}

		return listPostRelatedArticles(input.post_id)
	})
