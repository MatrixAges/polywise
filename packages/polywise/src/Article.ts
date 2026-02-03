import { PGlite } from '@electric-sql/pglite'

import { SCHEMA_KNOWLEDGE } from './consts'
import Pipeline from './Pipeline'
import * as sql from './sql'
import { ArticleArgs, ArticleEntity, ArticleWithSimilarity, SearchArticleArgs } from './types'

export default class Article {
	private db: PGlite | null = null
	private pipeline: Pipeline | null = null

	constructor(private pipeline_instance: Pipeline) {}

	init(db: PGlite) {
		this.db = db
		this.pipeline = this.pipeline_instance
	}

	async add(content: string) {
		const res = await this.process(content)
		return res?.id || null
	}

	async process(content: string) {
		if (!this.db) return null

		const res = await this.db.query<ArticleEntity>(sql.sql_process_article, [content])

		if (res.rows.length === 0) return null
		return res.rows[0]
	}

	async addEmbedding(article_id: number, content: string) {
		if (!this.db || !this.pipeline) return

		const embedding = await this.pipeline.embed(content)
		if (!embedding) return

		await this.db.query(sql.sql_insert_article_embedding, [article_id, `[${embedding.join(',')}]`])
	}

	async addWithEmbedding(content: string) {
		const result = await this.process(content)
		if (result && result.id) {
			await this.addEmbedding(result.id, content)
			return result.id
		}
		return null
	}

	async get(article_id: number) {
		if (!this.db) return null

		const res = await this.db.query<ArticleEntity>(sql.sql_get_article, [article_id])

		return res.rows.length > 0 ? res.rows : null
	}

	async getAll() {
		if (!this.db) return []

		const res = await this.db.query<ArticleEntity>(sql.sql_get_all_articles)

		return res.rows
	}

	async update(id: number, content: string) {
		if (!this.db) return null

		const res = await this.db.query<ArticleEntity>(sql.sql_update_article, [id, content])

		return res.rows.length > 0 ? res.rows[0] : null
	}

	async delete(article_id: number) {
		if (!this.db) return

		await this.db.query(`DELETE FROM ${SCHEMA_KNOWLEDGE}.articles WHERE id = $1`, [article_id])
	}

	async searchVector(query: string, limit?: number) {
		return this.searchByVector(query, limit)
	}

	async searchFts(query: string, limit?: number) {
		return this.searchByText(query, limit)
	}

	async searchByVector(query: string, limit?: number) {
		if (!this.db || !this.pipeline) return []

		const embedding = await this.pipeline.embed(query)
		if (!embedding) return []

		const res = await this.db.query<ArticleWithSimilarity>(sql.sql_search_articles_by_vector, [
			`[${embedding.join(',')}]`,
			limit ?? 10
		])

		return res.rows
	}

	async searchByText(query: string, limit?: number) {
		if (!this.db) return []

		const res = await this.db.query<ArticleWithSimilarity>(sql.sql_search_articles_by_text, [
			query,
			limit ?? 10
		])

		return res.rows.map(r => ({
			...r,
			similarity: (r as any).rank || 0
		}))
	}

	off() {
		this.db = null
		this.pipeline = null
	}
}
