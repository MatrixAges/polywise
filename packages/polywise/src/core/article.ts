import { getId } from 'shared'
import { injectable } from 'tsyringe'

import { app, system } from '@/consts'

import sql from '../sql'
import { getMetadata, querySql } from '../utils'

import type { ArticleEntity, ArticleWithSimilarity, SearchArticlesArgs, upsertArticleArgs } from '../types'
import type Polywise from './polywise'

@injectable()
export default class Index {
	private p!: Polywise

	init(p: Polywise) {
		this.p = p
	}

	async upsert(args: upsertArticleArgs) {
		const { id, content } = args
		const { metadata } = getMetadata(args)

		const article_id = id ?? getId()

		const res = await querySql<ArticleEntity>(this.p.db, sql.article.sql_upsert_article, [
			article_id,
			content,
			metadata
		])

		if (!res.length) return

		const embedding = await this.p.pipeline.embed(content)

		await querySql(this.p.db, sql.article.sql_upsert_article_embedding, [
			getId(),
			article_id,
			`[${embedding.join(',')}]`
		])

		return article_id
	}

	async get(id: string) {
		const res = await querySql<ArticleEntity>(this.p.db, sql.article.sql_get_article, [id])

		return res.length > 0 ? res[0] : null
	}

	async getMany(ids: Array<string>) {
		const res = await querySql<ArticleEntity>(this.p.db, sql.article.sql_get_articles_by_ids, [ids])

		if (res.length === 0) return

		return res.reduce(
			(acc, item) => {
				acc[item.id] = item

				return acc
			},
			{} as Record<string, ArticleEntity>
		)
	}

	async remove(id: string) {
		await querySql(this.p.db, sql.article.sql_delete_article, [id])

		return id
	}

	async searchByText(args: SearchArticlesArgs) {
		const { text, limit } = args

		return querySql<ArticleWithSimilarity>(this.p.db, sql.article.sql_search_articles_by_text, [
			text,
			limit ?? app.default_search_limit
		])
	}

	async searchByVector(args: SearchArticlesArgs) {
		const { text, limit, threshold } = args

		const embedding = await this.p.pipeline.embed(text)

		return querySql<ArticleWithSimilarity>(this.p.db, sql.article.sql_search_articles_by_vector, [
			`[${embedding.join(',')}]`,
			limit ?? app.default_search_limit,
			threshold ?? system.default_similarity_threshold
		])
	}
}
