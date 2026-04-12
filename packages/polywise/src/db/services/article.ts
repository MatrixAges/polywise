import { article } from '@core/db/schema'
import { env } from '@core/env'
import { SQL } from 'drizzle-orm'

import type { ArticleInsert } from '@core/db'

export async function addArticle(values: ArticleInsert) {
	const [res] = await env.db.insert(article).values(values).returning()
	return res
}

export async function getArticle(where: SQL) {
	const [res] = await env.db.select().from(article).where(where).limit(1)
	return res
}

interface GetArticlesOptions {
	where?: SQL
	orderBy?: SQL | Array<SQL>
	limit?: number
}

export async function getArticles(options: GetArticlesOptions = {}) {
	const { where, orderBy, limit } = options
	let query = env.db.select().from(article).$dynamic()

	if (where) query = query.where(where)
	if (orderBy) {
		const orderArgs = Array.isArray(orderBy) ? orderBy : [orderBy]
		query = query.orderBy(...orderArgs)
	}
	if (limit) query = query.limit(limit)

	const res = await query
	return res
}

export async function removeArticle(where: SQL) {
	await env.db.delete(article).where(where)
}

export async function setArticle(where: SQL, values: Partial<ArticleInsert>) {
	const res = await env.db.update(article).set(values).where(where).returning()
	return res
}
