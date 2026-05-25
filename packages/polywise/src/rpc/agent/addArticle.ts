import { article } from '@core/db/schema'
import { assertAgentWritableForKnowledge, getArticle } from '@core/db/services'
import { addAgentArticle } from '@core/db/services/externals'
import { eq } from 'drizzle-orm'
import { object, string, enum as zod_enum } from 'zod'

import { p } from '../../utils/trpc'

const article_for_type = article.for.enumValues

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/agent/addArticle',
			summary: 'Run Add Article'
		}
	})
	.input(
		object({
			agent_id: string(),
			article_id: string(),
			for_type: zod_enum(article_for_type)
		})
	)
	.mutation(async ({ input }) => {
		await assertAgentWritableForKnowledge(input.agent_id)

		const target_article = await getArticle(eq(article.id, input.article_id))

		if (!target_article) {
			throw new Error(`Article not found: ${input.article_id}`)
		}

		if (target_article.for !== input.for_type) {
			throw new Error(`Article type mismatch: expected ${input.for_type}, got ${target_article.for}`)
		}

		await addAgentArticle(input.agent_id, input.article_id)

		return { ok: true }
	})
