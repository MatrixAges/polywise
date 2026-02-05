import { PGlite } from '@electric-sql/pglite'
import to from 'await-to-js'

import { SCHEMA_KNOWLEDGE } from './consts'
import Pipeline from './Pipeline'
import * as sql from './sql'
import { catchError } from './decorators'

import type { ArticleEntity, ArticleWithSimilarity, ProcessArticleArgs, SearchArticlesArgs, FiltersArgs } from './types'

@catchError()
export default class Article {
	private db: PGlite | null = null
	private pipeline: Pipeline | null = null

	constructor(private pipeline_instance: Pipeline) {}

	init(db: PGlite) {
		this.db = db
		this.pipeline = this.pipeline_instance
	}

	async add(content: string) {
		const res = await this.process({ content })

		return res?.id || null
	}

	async process(args: ProcessArticleArgs) {
		if (!this.db) return null

		const { content, idol_id, root_ids, metrics_ids } = args

		const res = await this.db.query<ArticleEntity>(sql.sql_process_article, [
			content,
			idol_id ?? null,
			root_ids ?? null,
			metrics_ids ?? null
		])

		if (res.rows.length === 0) return null

		return res.rows[0]
	}

	async addEmbedding(article_id: number, content: string) {
		if (!this.db || !this.pipeline) return

		const embedding = await this.pipeline.embed(content)

		if (!embedding) return

		await this.db.query(sql.sql_insert_article_embedding, [article_id, `[${embedding.join(',')}]`])
	}

	async addWithEmbedding(content: string, args?: FiltersArgs | string) {
		const filters = typeof args === 'string' ? { idol_id: args } : (args ?? {})
		const [err, result] = await to(this.process({ content, ...filters }))

		if (err || !result?.id) return null

		await to(this.addEmbedding(result.id, content))

		return result.id
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

	async searchVector(query: string, limit?: number, filters?: FiltersArgs) {
		return this.searchByVector({ query, limit, ...filters })
	}

	async searchFts(query: string, limit?: number, filters?: FiltersArgs) {
		return this.searchByText({ query, limit, ...filters })
	}

	async searchByVector(args: SearchArticlesArgs | string, limit?: number) {
		if (!this.db || !this.pipeline) return []

		const query = typeof args === 'string' ? args : args.query
		const search_limit = typeof args === 'string' ? limit : args.limit
		const idol_id = typeof args === 'string' ? undefined : args.idol_id
		const root_ids = typeof args === 'string' ? undefined : args.root_ids
		const metrics_ids = typeof args === 'string' ? undefined : args.metrics_ids

		const embedding = await this.pipeline.embed(query)

		if (!embedding) return []

		const res = await this.db.query<ArticleWithSimilarity>(sql.sql_search_articles_by_vector, [
			`[${embedding.join(',')}]`,
			search_limit ?? 10,
			idol_id ?? null,
			root_ids ?? null,
			metrics_ids ?? null
		])

		return res.rows
	}

	async searchByText(args: SearchArticlesArgs | string, limit?: number) {
		if (!this.db) return []

		const query = typeof args === 'string' ? args : args.query
		const search_limit = typeof args === 'string' ? limit : args.limit
		const idol_id = typeof args === 'string' ? undefined : args.idol_id
		const root_ids = typeof args === 'string' ? undefined : args.root_ids
		const metrics_ids = typeof args === 'string' ? undefined : args.metrics_ids

		const res = await this.db.query<ArticleWithSimilarity>(sql.sql_search_articles_by_text, [
			query,
			search_limit ?? 10,
			idol_id ?? null,
			root_ids ?? null,
			metrics_ids ?? null
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
