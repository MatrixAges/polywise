import { injectable } from 'tsyringe'

import type { PGlite } from '@electric-sql/pglite'

import * as sql from './sql'
import Pipeline from './Pipeline'

import type { AddArticleArgs, ArticleArgs, ArticleEntity, ArticleWithSimilarity, SearchArticleArgs } from './types'

@injectable()
export default class Article {
	private db: PGlite | null = null

	private pipeline: Pipeline | null = null

	constructor(private pipeline_instance: Pipeline) {}

	init(args: ArticleArgs) {
		const { db } = args

		this.db = db
		this.pipeline = this.pipeline_instance
	}

	async add(args: AddArticleArgs) {
		if (!this.db) return

		const { title, content } = args

		const res = await this.db.query<{ id: number }>(sql.sql_process_article, [title, content])

		return res.rows[0].id
	}

	async addEmbedding(article_id: number, content: string) {
		if (!this.db || !this.pipeline) return

		const embedding = await this.pipeline.embed(content)

		await this.db.query(sql.sql_insert_article_embedding, [article_id, JSON.stringify(embedding)])
	}

	async addWithEmbedding(args: AddArticleArgs) {
		const { content } = args

		const article_id = await this.add(args)

		if (!article_id) return

		await this.addEmbedding(article_id, content)

		return article_id
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

	async searchByText(args: SearchArticleArgs) {
		if (!this.db) return []

		const { query, limit } = args

		const res = await this.db.query<ArticleEntity>(sql.sql_search_articles_by_text, [query, limit ?? 10])

		return res.rows
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

	async addEmbedding(article_id: number, content: string) {
		if (!this.db || !this.pipeline) return

		const embedding = await this.pipeline.embed(content)

		await this.db.query(sql.sql_insert_article_embedding, [article_id, `[${embedding.join(',')}]`])
	}

	async process(args: AddArticleArgs) {
		if (!this.db) return null

		const { title, content } = args

		const embedding = this.pipeline ? await this.pipeline.embed(content) : null

		await this.db.query(sql.sql_process_article, [title, content])

		const res = await this.db.query<ArticleEntity>(
			'SELECT * FROM knowledge.articles WHERE title = $1 ORDER BY id DESC LIMIT 1',
			[title]
		)

		if (res.rows.length > 0 && embedding) {
			await this.db.query(sql.sql_insert_article_embedding, [res.rows[0].id, `[${embedding.join(',')}]`])
		}

		return res.rows[0]
	}

	async process(args: AddArticleArgs) {
		if (!this.db) return null

		const { title, content } = args

		const embedding = this.pipeline ? await this.pipeline.embed(content) : null

		await this.db.query(sql.sql_process_article, [title, content])

		const res = await this.db.query<ArticleEntity>(
			'SELECT * FROM knowledge.articles WHERE title = $1 ORDER BY id DESC LIMIT 1',
			[title]
		)

		if (res.rows.length > 0 && embedding) {
			await this.db.query(sql.sql_insert_article_embedding, [res.rows[0].id, JSON.stringify(embedding)])
		}

		return res.rows[0]
	}

	async update(args: AddArticleArgs & { id: number }) {
		if (!this.db) return null

		const { id, title, content } = args

		await this.db.query(sql.sql_update_article, [id, title, content])

		const res = await this.db.query<ArticleEntity>('SELECT * FROM knowledge.articles WHERE id = $1', [id])

		return res.rows[0]
	}

	async delete(article_id: number) {
		if (!this.db) return

		await this.db.query('DELETE FROM knowledge.article_embeddings WHERE article_id = $1', [article_id])
		await this.db.query('DELETE FROM knowledge.articles WHERE id = $1', [article_id])
	}

	async searchFts(args: SearchArticleArgs) {
		return this.searchByText(args)
	}

	async searchVector(args: SearchArticleArgs) {
		return this.searchByVector(args)
	}

	off() {
		this.db = null
		this.pipeline = null
	}
}
