import { article } from '@core/db/schema'
import { getArticle } from '@core/db/services'
import { eq } from 'drizzle-orm'
import { object, string } from 'zod'

import { p } from '../../utils/trpc'
import { article_detail_schema, serializeArticleDetail } from './utils'

export default p
	.meta({
		openapi: {
			method: 'GET',
			path: '/article/read',
			description: 'Return one article by id with its serialized detail fields.'
		}
	})
	.input(
		object({
			id: string()
		})
	)
	.output(article_detail_schema)
	.query(async ({ input }) => {
		const target_article = await getArticle(eq(article.id, input.id))

		if (!target_article) {
			throw new Error(`Article not found: ${input.id}`)
		}

		return serializeArticleDetail(target_article)
	})
