import { article } from '@core/db/schema'
import { getArticle } from '@core/db/services'
import { saveArticle } from '@core/io'
import { eq } from 'drizzle-orm'
import { boolean, object, string, enum as zod_enum } from 'zod'

import { p } from '../../utils/trpc'
import { article_detail_schema, article_for_type, serializeArticleDetail } from './utils'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/article/update',
			description: 'Update an existing article title, content, type, and optionally rerun the pipeline.'
		}
	})
	.input(
		object({
			id: string(),
			title: string().optional(),
			content: string().optional(),
			for_type: zod_enum(article_for_type).optional(),
			exec_pipeline: boolean().optional()
		})
	)
	.output(article_detail_schema)
	.mutation(async ({ input }) => {
		const current_article = await getArticle(eq(article.id, input.id))

		if (!current_article) {
			throw new Error(`Article not found: ${input.id}`)
		}

		await saveArticle({
			article_id: input.id,
			title: input.title ?? current_article.title ?? '',
			content: input.content ?? current_article.content,
			for: input.for_type ?? current_article.for,
			scope_type: current_article.scope_type ?? 'global',
			scope_id: current_article.scope_id,
			source: current_article.source ?? 'agent',
			exec_pipeline: input.exec_pipeline
		})

		const saved_article = await getArticle(eq(article.id, input.id))

		if (!saved_article) {
			throw new Error(`Article not found after save: ${input.id}`)
		}

		return serializeArticleDetail(saved_article)
	})
