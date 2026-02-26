import to from 'await-to-js'
import { injectable } from 'tsyringe'

import { app, system } from '@/consts'

import sql from '../sql'
import { generateId, getFilters } from '../utils'

import type {
	ArticleEntity,
	ArticleWithSimilarity,
	getArticleArgs,
	getManyArticleArgs,
	removeArticleArgs,
	SearchArticlesArgs,
	upsertArticleArgs
} from '../types'
import type Polywise from './polywise'

@injectable()
export default class Index {
	private p!: Polywise

	init(p: Polywise) {
		this.p = p
	}

	async upsert(args: upsertArticleArgs) {
		const { id, content } = args
		const { root_ids, idol_id, context_id, metadata } = getFilters(args)

		const article_id = id ?? generateId()

		const res = await this.p.db.query<ArticleEntity>(sql.article.sql_upsert_article, [
			article_id,
			content,
			root_ids,
			idol_id,
			context_id,
			metadata
		])

		if (!res.rows.length) return null

		const embedding = await this.p.pipeline.embed(content)

		await this.p.db.query(sql.article.sql_upsert_article_embedding, [
			generateId(),
			article_id,
			`[${embedding.join(',')}]`
		])

		return article_id
	}

	async get(args: getArticleArgs) {
		const { id, root_ids, idol_id, context_id } = getFilters(args)

		const res = await this.p.db.query<ArticleEntity>(sql.article.sql_get_article, [
			id,
			root_ids,
			idol_id,
			context_id
		])

		return res.rows.length > 0 ? res.rows : null
	}

	async getMany(args: getManyArticleArgs) {
		const { ids, root_ids, idol_id, context_id } = getFilters(args)

		const res = await this.p.db.query<ArticleEntity>(sql.article.sql_get_articles_by_ids, [
			ids,
			root_ids,
			idol_id,
			context_id
		])

		if (res.rows.length === 0) return null

		return res.rows.reduce(
			(acc, item) => {
				acc[item.id] = item

				return acc
			},
			{} as Record<string, ArticleEntity>
		)
	}

	async remove(args: removeArticleArgs) {
		const { id, idol_id, root_ids, context_id } = getFilters(args)

		await this.p.db.query(sql.article.sql_delete_article, [id, root_ids, idol_id, context_id])

		return id
	}

	async searchByText(args: SearchArticlesArgs) {
		const { text, limit } = args
		const { idol_id, root_ids, context_id } = getFilters(args)

		const res = await this.p.db.query<ArticleWithSimilarity>(sql.article.sql_search_articles_by_text, [
			text,
			limit ?? app.article.default_search_limit,
			idol_id,
			root_ids,
			context_id
		])

		return res.rows
	}

	async searchByVector(args: SearchArticlesArgs) {
		const { text, limit, threshold } = args
		const { idol_id, root_ids, context_id } = getFilters(args)

		const embedding = await this.p.pipeline.embed(text)

		const res = await this.p.db.query<ArticleWithSimilarity>(sql.article.sql_search_articles_by_vector, [
			`[${embedding.join(',')}]`,
			limit ?? app.article.default_search_limit,
			root_ids,
			idol_id,
			context_id,
			threshold ?? system.default_config.default_similarity_threshold
		])

		return res.rows
	}
}
