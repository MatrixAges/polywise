import { article, post_article } from '@core/db/schema'
import { env } from '@core/env'
import { asc, desc, eq, SQL } from 'drizzle-orm'

interface ArgsGetPostArticles {
	where?: SQL
	limit?: number
	offset?: number
}

export const getPostArticles = async (args: ArgsGetPostArticles = {}) => {
	const { where, limit, offset } = args

	let query = env.db
		.select({ article, post_article })
		.from(post_article)
		.innerJoin(article, eq(post_article.article_id, article.id))
		.orderBy(desc(post_article.created_at), desc(article.updated_at), asc(article.created_at))
		.$dynamic()

	if (where) query = query.where(where)
	if (limit) query = query.limit(limit)
	if (offset) query = query.offset(offset)

	return query
}

export const addPostArticle = async (post_id: string, article_id: string) => {
	return env.db
		.insert(post_article)
		.values({ post_id, article_id })
		.returning()
		.then(res => res[0])
}

export const removePostArticle = async (where: SQL) => {
	return env.db
		.delete(post_article)
		.where(where)
		.returning()
		.then(res => res[0])
}
