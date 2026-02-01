import * as sql from './sql'
import getEmbedding from './utils/embedding'

import type { ArticleEntity, ArticleWithSimilarity } from './types'

interface ArticleConstructorParams {
	exec: (sql: string | string[]) => Promise<void>
	query: <T = any>(sql: string, params?: any[]) => Promise<T>
	embeddingCacheDir?: string
}

export default class Article {
	private exec: (sql: string | string[]) => Promise<void>
	private query: <T = any>(sql: string, params?: any[]) => Promise<T>
	private embeddingCacheDir?: string

	constructor(params: ArticleConstructorParams) {
		this.exec = params.exec
		this.query = params.query
		this.embeddingCacheDir = params.embeddingCacheDir
	}

	async add(title: string, content: string) {
		const res = await this.query<{ id: number }>(sql.sql_process_article, [title, content])
		return res[0].id
	}

	async addEmbedding(article_id: number, content: string) {
		const embedding = await getEmbedding(content, this.embeddingCacheDir)
		await this.query(sql.sql_insert_article_embedding, [article_id, embedding])
	}

	async addWithEmbedding(title: string, content: string) {
		const article_id = await this.add(title, content)
		await this.addEmbedding(article_id, content)
		return article_id
	}

	async get(article_id: number) {
		return await this.query<ArticleEntity[]>(sql.sql_get_article, [article_id])
	}

	async getAll() {
		return await this.query<ArticleEntity[]>(sql.sql_get_all_articles)
	}

	async searchByText(query: string, limit = 10) {
		return await this.query<ArticleEntity[]>(sql.sql_search_articles_by_text, [query, limit])
	}

	async searchByVector(query: string, limit = 10) {
		const embedding = await getEmbedding(query, this.embeddingCacheDir)
		return await this.query<ArticleWithSimilarity[]>(sql.sql_search_articles_by_vector, [embedding, limit])
	}
}
