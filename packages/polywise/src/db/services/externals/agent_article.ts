import { agent_article, article } from '@core/db/schema'
import { env } from '@core/env'
import { and, asc, desc, eq, SQL } from 'drizzle-orm'

export const getAgentArticles = async (args: { agent_id: string; for_type?: string }) => {
	const { agent_id, for_type } = args
	const where = for_type
		? and(
				eq(agent_article.agent_id, agent_id),
				eq(article.for, for_type as 'linkcase' | 'wiki' | 'memory' | 'user')
			)
		: eq(agent_article.agent_id, agent_id)

	return env.db
		.select({ article })
		.from(agent_article)
		.innerJoin(article, eq(agent_article.article_id, article.id))
		.where(where)
		.orderBy(desc(article.updated_at), asc(article.created_at))
}

export const addAgentArticle = async (agent_id: string, article_id: string) => {
	return env.db
		.insert(agent_article)
		.values({ agent_id, article_id })
		.returning()
		.then(res => res[0])
}

export const removeAgentArticle = async (where: SQL) => {
	return env.db
		.delete(agent_article)
		.where(where)
		.returning()
		.then(res => res[0])
}
