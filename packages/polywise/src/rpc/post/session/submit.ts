import { object, string } from 'zod'

import { submit } from '../../../fst/utils'
import { p } from '../../../utils/trpc'
import { ensurePostSession, getPostById } from '../utils'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/post/session/submit',
			description: 'Run Submit'
		}
	})
	.input(
		object({
			post_id: string(),
			message: string()
		})
	)
	.mutation(async ({ input }) => {
		const post = await getPostById(input.post_id)

		if (!post) {
			throw new Error(`Post not found: ${input.post_id}`)
		}

		const { session_id } = await ensurePostSession(input.post_id)

		await submit({ id: session_id }, input.message)

		return {
			session_id
		}
	})
