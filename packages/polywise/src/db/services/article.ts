import { article } from '@core/db/schema'
import { env } from '@core/env'
import { SQL } from 'drizzle-orm'

import type { ArticleInsert } from '@core/db'

interface ArgsGetArticles {
	where?: SQL
	orderBy?: SQL | Array<SQL>
	limit?: number
}

export const addArticle = async (values: ArticleInsert) => {
	return env.db
		.insert(article)
		.values(values)
		.returning()
		.then(res => res[0])
}

export const getArticle = async (where: SQL) => {
	return env.db
		.select()
		.from(article)
		.where(where)
		.limit(1)
		.then(res => res[0])
}

export const getArticles = async (args: ArgsGetArticles = {}) => {
	const { where, orderBy, limit } = args

	let query = env.db.select().from(article).$dynamic()

	if (where) query = query.where(where)

	if (orderBy) {
		const orderArgs = Array.isArray(orderBy) ? orderBy : [orderBy]

		query = query.orderBy(...orderArgs)
	}

	if (limit) query = query.limit(limit)

	return query
}

export const removeArticle = async (where: SQL) => {
	return env.db.delete(article).where(where).returning()
}

export const setArticle = async (where: SQL, values: Partial<ArticleInsert>) => {
	return env.db.update(article).set(values).where(where).returning()
}
