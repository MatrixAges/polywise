import { edge_article } from '@core/db/schema'
import { env } from '@core/env'
import { SQL } from 'drizzle-orm'

export const addEdgeArticle = async (edge_id: string, article_id: string) => {
	return env.db
		.insert(edge_article)
		.values({ edge_id, article_id })
		.onConflictDoNothing()
		.returning()
		.then(res => res[0] ?? null)
}

export const getEdgeArticles = async (args: { where?: SQL }) => {
	const { where } = args

	let query = env.db.select().from(edge_article).$dynamic()

	if (where) {
		query = query.where(where)
	}

	return query
}

export const removeEdgeArticle = async (where: SQL) => {
	return env.db
		.delete(edge_article)
		.where(where)
		.returning()
		.then(res => res[0] ?? null)
}
