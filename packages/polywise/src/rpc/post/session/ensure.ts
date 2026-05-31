import { object, string } from 'zod'

import { p } from '../../../utils/trpc'
import { ensurePostSession, getPostById } from '../utils'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/post/session/ensure',
			description: 'Create the chat session for a post if it does not already exist, then return it.'
		}
	})
	.input(object({ post_id: string() }))
	.mutation(async ({ input }) => {
		const post = await getPostById(input.post_id)

		if (!post) {
			throw new Error(`Post not found: ${input.post_id}`)
		}

		return ensurePostSession(input.post_id)
	})
