import { agent_article, article } from '@core/db/schema'
import { getArticle } from '@core/db/services'
import { removeAgentArticle } from '@core/db/services/externals'
import { remove } from '@core/io'
import { eq } from 'drizzle-orm'
import { object, string } from 'zod'

import { p } from '../../utils/trpc'

const input_type = object({
	agent_id: string(),
	article_id: string()
})

export default p.input(input_type).mutation(async ({ input }) => {
	const current_article = await getArticle(eq(article.id, input.article_id))

	if (!current_article) {
		return null
	}

	await removeAgentArticle(eq(agent_article.article_id, input.article_id))

	await remove(input.article_id)

	return current_article
})
