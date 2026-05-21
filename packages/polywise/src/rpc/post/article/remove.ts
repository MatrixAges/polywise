import { post_article } from '@core/db/schema'
import { removePostArticle } from '@core/db/services/externals'
import { and, eq } from 'drizzle-orm'
import { object, string } from 'zod'

import { p } from '../../../utils/trpc'
import { getPostById } from '../utils'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/post/article/remove',
			summary: 'Run Remove'
		}
	})
	.input(
		object({
			post_id: string(),
			article_id: string()
		})
	)
	.mutation(async ({ input }) => {
		const post = await getPostById(input.post_id)

		if (!post) {
			throw new Error(`Post not found: ${input.post_id}`)
		}

		const where = and(eq(post_article.post_id, input.post_id), eq(post_article.article_id, input.article_id))

		if (!where) {
			return { ok: true }
		}

		await removePostArticle(where)

		return { ok: true }
	})
