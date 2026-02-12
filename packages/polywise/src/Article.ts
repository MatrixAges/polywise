import to from 'await-to-js'
import { injectable } from 'tsyringe'

import { SCHEMA_KNOWLEDGE } from './consts'
import * as sql from './sql'

import type Polywise from './Polywise'
import type { ArticleEntity, ArticleWithSimilarity, FiltersArgs, ProcessArticleArgs, SearchArticlesArgs } from './types'

@injectable()
export default class Article {
	private p: Polywise

	init(p: Polywise) {
		this.p = p
	}

	async add(content: string) {
		const res = await this.process({ content })

		return res?.id || null
	}

	async process(args: ProcessArticleArgs) {
		const { content, idol_id, root_ids, metrics_ids, metadata } = args

		const res = await this.p.db.query<ArticleEntity>(sql.sql_process_article, [
			content,
			idol_id ?? null,
			root_ids ?? null,
			metrics_ids ?? null,
			JSON.stringify(metadata ?? {})
		])

		if (res.rows.length === 0) return null

		return res.rows[0]
	}

	async addEmbedding(article_id: number, content: string) {
		const embedding = await this.p.pipeline.embed(content)

		if (!embedding) return

		await this.p.db.query(sql.sql_insert_article_embedding, [article_id, `[${embedding.join(',')}]`])
	}

	async addWithEmbedding(content: string, args?: FiltersArgs | string) {
		const filters = typeof args === 'string' ? { idol_id: args } : (args ?? {})

		const [err, result] = await to(this.process({ content, ...filters }))

		if (err || !result?.id) return null

		await to(this.addEmbedding(result.id, content))

		return result.id
	}

	async get(article_id: number) {
		const res = await this.p.db.query<ArticleEntity>(sql.sql_get_article, [article_id])

		return res.rows.length > 0 ? res.rows : null
	}

	async getAll() {
		const res = await this.p.db.query<ArticleEntity>(sql.sql_get_all_articles)

		return res.rows
	}

	async update(id: number, content: string) {
		const res = await this.p.db.query<ArticleEntity>(sql.sql_update_article, [id, content])

		return res.rows.length > 0 ? res.rows[0] : null
	}

	async delete(article_id: number) {
		if (!this.p.db) return

		await this.p.db.query(`DELETE FROM ${SCHEMA_KNOWLEDGE}.articles WHERE id = $1`, [article_id])
	}

	async searchByVector(args: SearchArticlesArgs) {
		const { query, limit, idol_id, root_ids, metrics_ids } = args

		const embedding = await this.p.pipeline.embed(query)

		if (!embedding) return []

		const res = await this.p.db.query<ArticleWithSimilarity>(sql.sql_search_articles_by_vector, [
			`[${embedding.join(',')}]`,
			limit ?? 10,
			idol_id ?? null,
			root_ids ?? null,
			metrics_ids ?? null
		])

		return res.rows
	}

	async searchByText(args: SearchArticlesArgs) {
		const { query, limit, idol_id, root_ids, metrics_ids } = args

		const res = await this.p.db.query<ArticleWithSimilarity>(sql.sql_search_articles_by_text, [
			query,
			limit ?? 10,
			idol_id ?? null,
			root_ids ?? null,
			metrics_ids ?? null
		])

		return res.rows.map(r => ({
			...r,
			similarity: (r as any).rank || 0
		}))
	}
}
