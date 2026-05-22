import { article } from '@core/db/schema'
import { getArticle } from '@core/db/services'
import { eq } from 'drizzle-orm'
import { boolean, date, object, string } from 'zod'

import { p } from '../../utils/trpc'

export default p
	.meta({
		openapi: {
			method: 'GET',
			path: '/article/read',
			summary: 'Read an article'
		}
	})
	.input(
		object({
			id: string()
		})
	)
	.output(
		object({
			id: string(),
			title: string().nullable(),
			content: string(),
			for_type: string(),
			source: string().nullable(),
			is_pipelined: boolean(),
			created_at: date().nullable(),
			updated_at: date().nullable()
		})
	)
	.query(async ({ input }) => {
		const target_article = await getArticle(eq(article.id, input.id))

		if (!target_article) {
			throw new Error(`Article not found: ${input.id}`)
		}

		return {
			id: target_article.id,
			title: target_article.title,
			content: target_article.content,
			for_type: target_article.for,
			source: target_article.source ?? null,
			is_pipelined: target_article.is_pipelined,
			created_at: target_article.created_at,
			updated_at: target_article.updated_at
		}
	})
