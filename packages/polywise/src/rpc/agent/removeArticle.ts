import { agent_article } from '@core/db/schema'
import { removeAgentArticle } from '@core/db/services/externals'
import { and, eq } from 'drizzle-orm'
import { object, string } from 'zod'

import { p } from '../../utils/trpc'

const input_type = object({
	agent_id: string(),
	article_id: string()
})

export default p.input(input_type).mutation(async ({ input }) => {
	const where = and(eq(agent_article.agent_id, input.agent_id), eq(agent_article.article_id, input.article_id))

	if (!where) {
		return { ok: true }
	}

	await removeAgentArticle(where)

	return { ok: true }
})
