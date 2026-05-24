import { agent_article, article } from '@core/db/schema'
import { env } from '@core/env'
import { and, asc, desc, eq, SQL } from 'drizzle-orm'

export const getAgentArticles = async (args: { agent_id: string; for_type?: string }) => {
	const { agent_id, for_type } = args
	const related_where = for_type
		? and(
				eq(agent_article.agent_id, agent_id),
				eq(article.for, for_type as 'linkcase' | 'wiki' | 'memory' | 'user')
			)
		: eq(agent_article.agent_id, agent_id)
	const private_where = for_type
		? and(
				eq(article.scope_type, 'agent'),
				eq(article.scope_id, agent_id),
				eq(article.for, for_type as 'linkcase' | 'wiki' | 'memory' | 'user')
			)
		: and(eq(article.scope_type, 'agent'), eq(article.scope_id, agent_id))

	const [related_rows, private_rows] = await Promise.all([
		env.db
			.select({ article })
			.from(agent_article)
			.innerJoin(article, eq(agent_article.article_id, article.id))
			.where(related_where)
			.orderBy(desc(article.updated_at), asc(article.created_at)),
		env.db
			.select({ article })
			.from(article)
			.where(private_where)
			.orderBy(desc(article.updated_at), asc(article.created_at))
	])

	const article_map = new Map<string, { article: (typeof related_rows)[number]['article'] }>()

	for (const item of [...related_rows, ...private_rows]) {
		article_map.set(item.article.id, item)
	}

	return Array.from(article_map.values()).sort((a, b) => {
		const a_updated = a.article.updated_at?.getTime() ?? 0
		const b_updated = b.article.updated_at?.getTime() ?? 0

		if (a_updated !== b_updated) {
			return b_updated - a_updated
		}

		const a_created = a.article.created_at?.getTime() ?? 0
		const b_created = b.article.created_at?.getTime() ?? 0

		return a_created - b_created
	})
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
