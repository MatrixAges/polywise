import * as sql from './sql'
import getEmbedding from './utils/embedding'

import type { AddArticleParams, ArticleEntity, ArticleWithSimilarity, SearchArticleParams } from './types'

interface ArticleParams {
	embedding_cache_dir?: string

	query: <T = any>(sql: string, params?: any[]) => Promise<T>
}

export default class Article {
	private query: <T = any>(sql: string, params?: any[]) => Promise<T>

	private embedding_cache_dir?: string

	constructor(params: ArticleParams) {
		this.query = params.query
		this.embedding_cache_dir = params.embedding_cache_dir
	}

	async add(params: AddArticleParams) {
		const res = await this.query<{ id: number }[]>(sql.sql_process_article, [params.title, params.content])

		return res[0].id
	}

	async addEmbedding(article_id: number, content: string) {
		const embedding = await getEmbedding(content, this.embedding_cache_dir)

		await this.query(sql.sql_insert_article_embedding, [article_id, embedding])
	}

	async addWithEmbedding(params: AddArticleParams) {
		const article_id = await this.add(params)

		await this.addEmbedding(article_id, params.content)

		return article_id
	}

	async get(article_id: number) {
		return await this.query<ArticleEntity[]>(sql.sql_get_article, [article_id])
	}

	async getAll() {
		return await this.query<ArticleEntity[]>(sql.sql_get_all_articles)
	}

	async searchByText(params: SearchArticleParams) {
		return await this.query<ArticleEntity[]>(sql.sql_search_articles_by_text, [
			params.query,
			params.limit ?? 10
		])
	}

	async searchByVector(params: SearchArticleParams) {
		const embedding = await getEmbedding(params.query, this.embedding_cache_dir)

		return await this.query<ArticleWithSimilarity[]>(sql.sql_search_articles_by_vector, [
			embedding,
			params.limit ?? 10
		])
	}
}
