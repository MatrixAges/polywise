import { article } from '@core/db/schema'
import { getArticle } from '@core/db/services'
import { addPostArticle } from '@core/db/services/externals'
import { and, eq } from 'drizzle-orm'
import { object, string } from 'zod'

import { p } from '../../../utils/trpc'
import { getPostById } from '../utils'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/post/article/add',
			summary: 'Run Add'
		}
	})
	.input(
		object({
			post_id: string(),
			article_id: string()
		})
	)
	.mutation(async ({ input }) => {
		const [post, target_article] = await Promise.all([
			getPostById(input.post_id),
			getArticle(eq(article.id, input.article_id))
		])

		if (!post) {
			throw new Error(`Post not found: ${input.post_id}`)
		}

		if (!target_article) {
			throw new Error(`Article not found: ${input.article_id}`)
		}

		if (input.post_id === input.article_id) {
			throw new Error('Cannot relate a post to itself.')
		}

		await addPostArticle(input.post_id, input.article_id)

		return { ok: true }
	})
