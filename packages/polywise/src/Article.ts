import { PGlite } from '@electric-sql/pglite'

import Pipeline from './Pipeline'
import * as sql from './sql'
import { ArticleArgs, ArticleEntity, ArticleWithSimilarity, SearchArticleArgs } from './types'

export default class Article {
	private db: PGlite | null = null
	private pipeline: Pipeline | null = null

	constructor(private pipeline_instance: Pipeline) {}

	init(args: ArticleArgs) {
		const { db } = args
		this.db = db
		this.pipeline = this.pipeline_instance
	}

	async add(article: { title: string; content: string }) {
		const res = await this.process(article)
		return res?.id || null
	}

	async process(article: { title: string; content: string }) {
		if (!this.db) return null

		const { title, content } = article
		const res = await this.db.query<ArticleEntity>(sql.sql_process_article, [title, content])

		if (res.rows.length === 0) return null
		return res.rows[0]
	}

	async addEmbedding(article_id: number, content: string) {
		if (!this.db || !this.pipeline) return

		const embedding = await this.pipeline.embed(content)

		await this.db.query(sql.sql_insert_article_embedding, [article_id, `[${embedding.join(',')}]`])
	}

	async addWithEmbedding(article: { title: string; content: string }) {
		const result = await this.process(article)
		if (result && result.id) {
			await this.addEmbedding(result.id, article.content)
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

	async update(article: { id: number; title: string; content: string }) {
		if (!this.db) return null

		const { id, title, content } = article
		const res = await this.db.query<ArticleEntity>(sql.sql_update_article, [id, title, content])

		return res.rows.length > 0 ? res.rows[0] : null
	}

	async delete(article_id: number) {
		if (!this.db) return

		await this.db.query('DELETE FROM knowledge.articles WHERE id = $1', [article_id])
	}

	async searchVector(args: SearchArticleArgs) {
		return this.searchByVector(args)
	}

	async searchFts(args: SearchArticleArgs) {
		return this.searchByText(args)
	}

	async searchByVector(args: SearchArticleArgs) {
		if (!this.db || !this.pipeline) return []

		const { query, limit } = args

		const embedding = await this.pipeline.embed(query)

		const res = await this.db.query<ArticleWithSimilarity>(sql.sql_search_articles_by_vector, [
			`[${embedding.join(',')}]`,
			limit ?? 10
		])

		return res.rows
	}

	async searchByText(args: SearchArticleArgs) {
		if (!this.db) return []

		const { query, limit } = args

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
