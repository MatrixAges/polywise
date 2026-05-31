import { agent_article, article } from '@core/db/schema'
import { assertAgentWritableForKnowledge, getArticle } from '@core/db/services'
import { removeAgentArticle } from '@core/db/services/externals'
import remove from '@core/io/remove'
import { and, eq } from 'drizzle-orm'
import { object, string } from 'zod'

import { p } from '../../utils/trpc'
import { cleanupPrivateAgentArticle } from './privateArticle'

const input_type = object({
	agent_id: string(),
	article_id: string()
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/agent/removeArticle',
			description:
				'Remove an article from an agent. If the article is a private article owned by that agent, delete it entirely.'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		await assertAgentWritableForKnowledge(input.agent_id)

		const target_article = await getArticle(eq(article.id, input.article_id))

		if (target_article && target_article.scope_type === 'agent' && target_article.scope_id === input.agent_id) {
			await cleanupPrivateAgentArticle({
				agent_id: input.agent_id,
				article_id: input.article_id
			})
			await remove(input.article_id)

			return { ok: true }
		}

		const where = and(
			eq(agent_article.agent_id, input.agent_id),
			eq(agent_article.article_id, input.article_id)
		)

		if (!where) {
			return { ok: true }
		}

		await removeAgentArticle(where)

		return { ok: true }
	})
