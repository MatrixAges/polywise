import { object, string } from 'zod'

import { p } from '../../../utils/trpc'
import { getPostById, listPostRelatedProjects } from '../utils'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/post/project/query',
			description: 'Read Query'
		}
	})
	.input(object({ post_id: string() }))
	.query(async ({ input }) => {
		const post = await getPostById(input.post_id)

		if (!post) {
			throw new Error(`Post not found: ${input.post_id}`)
		}

		return listPostRelatedProjects(input.post_id)
	})
