import { PGlite } from '@electric-sql/pglite'

import * as sql from './sql'
import getEmbedding from './utils/embedding'

import type {
	AddArticleParams,
	ArticleEntity,
	ArticleParams,
	ArticleWithSimilarity,
	SearchArticleParams
} from './types'

export default class Article {
	private embedding_cache_dir?: string

	private db: PGlite

	constructor(params: ArticleParams) {
		this.db = params.db
		this.embedding_cache_dir = params.embedding_cache_dir
	}

	async add(params: AddArticleParams) {
		const res = await this.db.query<{ id: number }>(sql.sql_process_article, [params.title, params.content])

		return res.rows[0].id
	}

	async addEmbedding(article_id: number, content: string) {
		const embedding = await getEmbedding(content, this.embedding_cache_dir)

		await this.db.query(sql.sql_insert_article_embedding, [article_id, JSON.stringify(embedding)])
	}

	async addWithEmbedding(params: AddArticleParams) {
		const article_id = await this.add(params)

		await this.addEmbedding(article_id, params.content)

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

	async searchByText(params: SearchArticleParams) {
		const res = await this.db.query<ArticleEntity>(sql.sql_search_articles_by_text, [
			params.query,
			params.limit ?? 10
		])

		return res.rows
	}

	async searchByVector(params: SearchArticleParams) {
		const embedding = await getEmbedding(params.query, this.embedding_cache_dir)

		const res = await this.db.query<ArticleWithSimilarity>(sql.sql_search_articles_by_vector, [
			JSON.stringify(embedding),
			params.limit ?? 10
		])

		return res.rows
	}
}
