import { PGlite } from '@electric-sql/pglite'

import * as sql from './sql'
import getEmbedding from './utils/embedding'

import type { AddArticleArgs, ArticleArgs, ArticleEntity, ArticleWithSimilarity, SearchArticleArgs } from './types'

export default class Article {
	private embedding_cache_dir?: string

	private db: PGlite

	constructor(args: ArticleArgs) {
		const { db, embedding_cache_dir } = args

		this.db = db
		this.embedding_cache_dir = embedding_cache_dir
	}

	async add(args: AddArticleArgs) {
		const { title, content } = args

		const res = await this.db.query<{ id: number }>(sql.sql_process_article, [title, content])

		return res.rows[0].id
	}

	async addEmbedding(article_id: number, content: string) {
		const embedding = await getEmbedding(content, this.embedding_cache_dir)

		await this.db.query(sql.sql_insert_article_embedding, [article_id, JSON.stringify(embedding)])
	}

	async addWithEmbedding(args: AddArticleArgs) {
		const { content } = args

		const article_id = await this.add(args)

		await this.addEmbedding(article_id, content)

		return article_id
	}

	async get(article_id: number) {
		const res = await this.db.query<ArticleEntity>(sql.sql_get_article, [article_id])

		return res.rows
	}

	async getAll() {
		const res = await this.db.query<ArticleEntity>(sql.sql_get_all_articles)

		return res.rows
	}

	async searchByText(args: SearchArticleArgs) {
		const { query, limit } = args

		const res = await this.db.query<ArticleEntity>(sql.sql_search_articles_by_text, [query, limit ?? 10])

		return res.rows
	}

	async searchByVector(args: SearchArticleArgs) {
		const { query, limit } = args

		const embedding = await getEmbedding(query, this.embedding_cache_dir)

		const res = await this.db.query<ArticleWithSimilarity>(sql.sql_search_articles_by_vector, [
			JSON.stringify(embedding),
			limit ?? 10
		])

		return res.rows
	}
}
