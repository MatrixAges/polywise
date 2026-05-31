import { post_session } from '@core/db/schema'
import { getPostSessions } from '@core/db/services/externals'
import { eq } from 'drizzle-orm'
import { object, string } from 'zod'

import { p } from '../../../utils/trpc'
import { getPostById } from '../utils'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/post/session/get',
			description: 'Return the session id currently linked to a post, if any.'
		}
	})
	.input(object({ post_id: string() }))
	.query(async ({ input }) => {
		const post = await getPostById(input.post_id)

		if (!post) {
			throw new Error(`Post not found: ${input.post_id}`)
		}

		const linked_session = await getPostSessions({
			where: eq(post_session.post_id, input.post_id)
		}).then(res => res[0])

		return {
			session_id: linked_session?.session.id ?? null
		}
	})
