import { article, link_article } from '@core/db/schema'
import { env } from '@core/env'
import { asc, desc, eq, SQL } from 'drizzle-orm'

interface ArgsGetLinkArticles {
	where?: SQL
	orderBy?: SQL | Array<SQL>
	limit?: number
}

export const getLinkArticles = async (args: ArgsGetLinkArticles = {}) => {
	const {
		where,
		orderBy = [desc(link_article.created_at), desc(article.updated_at), asc(article.created_at)],
		limit
	} = args

	let query = env.db
		.select({ article, link_article })
		.from(link_article)
		.innerJoin(article, eq(link_article.article_id, article.id))
		.$dynamic()

	if (where) query = query.where(where)

	if (orderBy) {
		const order_args = Array.isArray(orderBy) ? orderBy : [orderBy]

		query = query.orderBy(...order_args)
	}

	if (limit) query = query.limit(limit)

	return query
}

export const addLinkArticle = async (link_id: string, article_id: string) => {
	return env.db
		.insert(link_article)
		.values({ link_id, article_id })
		.onConflictDoNothing()
		.returning()
		.then(res => res[0] ?? null)
}

export const removeLinkArticle = async (where: SQL) => {
	return env.db
		.delete(link_article)
		.where(where)
		.returning()
		.then(res => res[0] ?? null)
}
