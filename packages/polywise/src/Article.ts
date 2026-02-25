import to from 'await-to-js'
import { injectable } from 'tsyringe'

import { DEFAULT_SIMILARITY_THRESHOLD } from './consts'
import {
	sql_delete_article,
	sql_get_all_articles,
	sql_get_article,
	sql_get_articles_by_ids,
	sql_insert_article_embedding,
	sql_process_article,
	sql_search_articles_by_text,
	sql_search_articles_by_vector,
	sql_update_article
} from './sql'
import { generateId } from './utils'

import type Polywise from './Polywise'
import type { ArticleEntity, ArticleWithSimilarity, FiltersArgs, ProcessArticleArgs, SearchArticlesArgs } from './types'

@injectable()
export default class Article {
	private p!: Polywise

	init(p: Polywise) {
		this.p = p
	}

	async add(content: string) {
		const res = await this.process({ content })

		return res?.id || null
	}

	async process(args: ProcessArticleArgs) {
		const { content, idol_id, root_ids, context_id, metadata } = args

		const article_id = generateId()

		const res = await this.p.db.query<ArticleEntity>(sql_process_article, [
			article_id,
			content,
			idol_id ?? null,
			root_ids ?? null,
			context_id ?? null,
			JSON.stringify(metadata ?? {})
		])

		if (res.rows.length === 0) return null

		return res.rows[0]
	}

	async addEmbedding(article_id: string, content: string) {
		const embedding = await this.p.pipeline.embed(content)

		if (!embedding) return

		const embedding_id = generateId()
		await this.p.db.query(sql_insert_article_embedding, [embedding_id, article_id, `[${embedding.join(',')}]`])
	}

	async addWithEmbedding(content: string, args?: FiltersArgs | string) {
		const filters = typeof args === 'string' ? { idol_id: args } : (args ?? {})

		const [err, result] = await to(this.process({ content, ...filters }))

		if (err || !result?.id) return null

		await to(this.addEmbedding(result.id, content))

		return result.id
	}

	async get(article_id: string) {
		const res = await this.p.db.query<ArticleEntity>(sql_get_article, [article_id])

		return res.rows.length > 0 ? res.rows : null
	}

	async getMany(article_ids: Array<string>) {
		if (article_ids.length === 0) return []
		const res = await this.p.db.query<ArticleEntity>(sql_get_articles_by_ids, [article_ids])
		return res.rows
	}

	async getAll() {
		const res = await this.p.db.query<ArticleEntity>(sql_get_all_articles)

		return res.rows
	}

	async update(id: string, args: ProcessArticleArgs) {
		const { content, idol_id, root_ids, context_id, metadata } = args
		const metadata_payload = metadata ? JSON.stringify(metadata) : null

		const res = await this.p.db.query<ArticleEntity>(sql_update_article, [
			id,
			content,
			idol_id ?? null,
			root_ids ?? null,
			context_id ?? null,
			metadata_payload,
			idol_id ?? null,
			root_ids ?? null,
			context_id ?? null
		])

		return res.rows.length > 0 ? res.rows[0] : null
	}

	async delete(article_id: string, filters: FiltersArgs = {}) {
		if (!this.p.db) return

		const { idol_id, root_ids, context_id } = filters

		await this.p.db.query(sql_delete_article, [
			article_id,
			idol_id ?? null,
			root_ids ?? null,
			context_id ?? null
		])
	}

	async searchByVector(args: SearchArticlesArgs) {
		const { query, limit, idol_id, root_ids, context_id, threshold } = args

		const embedding = await this.p.pipeline.embed(query)

		if (!embedding) return []

		const res = await this.p.db.query<ArticleWithSimilarity>(sql_search_articles_by_vector, [
			`[${embedding.join(',')}]`,
			limit ?? 10,
			idol_id ?? null,
			root_ids ?? null,
			context_id ?? null,
			threshold ?? DEFAULT_SIMILARITY_THRESHOLD
		])

		return res.rows
	}

	async searchByText(args: SearchArticlesArgs) {
		const { query, limit, idol_id, root_ids, context_id } = args

		const res = await this.p.db.query<ArticleWithSimilarity>(sql_search_articles_by_text, [
			query,
			limit ?? 10,
			idol_id ?? null,
			root_ids ?? null,
			context_id ?? null
		])

		return res.rows.map(r => ({
			...r,
			similarity: (r as any).rank || 0,
			metadata: (r as any).metadata ?? {},
			updated_at: (r as any).updated_at,
			context_id: (r as any).context_id
		}))
	}
}
