import { eq } from 'drizzle-orm'
import { boolean, object, string } from 'zod'

import { post_session, session } from '../../db/schema'
import { setSession } from '../../db/services'
import { getPostSessions } from '../../db/services/externals'
import { saveArticle } from '../../io'
import { p } from '../../utils/trpc'
import { getPostById, getPostSessionTitle, normalizePostForType } from './utils'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/post/update',
			description: 'Run Update'
		}
	})
	.input(
		object({
			id: string(),
			title: string().optional(),
			content: string().optional(),
			for_type: string().optional(),
			exec_pipeline: boolean().optional()
		})
	)
	.mutation(async ({ input }) => {
		const current_post = await getPostById(input.id)

		if (!current_post) {
			throw new Error(`Post not found: ${input.id}`)
		}

		const next_for_type = normalizePostForType(input.for_type ?? current_post.for_type)
		const next_title = input.title ?? current_post.title ?? ''
		const next_content = input.content ?? current_post.content

		await saveArticle({
			article_id: input.id,
			title: next_title,
			content: next_content,
			for: next_for_type,
			exec_pipeline: input.exec_pipeline
		})

		const linked_session = await getPostSessions({
			where: eq(post_session.post_id, input.id)
		}).then(res => res[0])

		if (linked_session) {
			await setSession(eq(session.id, linked_session.session.id), {
				title: getPostSessionTitle({
					title: next_title || null,
					for_type: next_for_type
				})
			})
		}

		return getPostById(input.id)
	})
