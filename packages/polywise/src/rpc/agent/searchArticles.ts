import { agent_article, article } from '@core/db/schema'
import { env } from '@core/env'
import { fullTextSearch } from '@core/io'
import { and, asc, desc, eq, inArray, like, notInArray, or } from 'drizzle-orm'
import { number, object, string, enum as zod_enum } from 'zod'

import { p } from '../../utils/trpc'

const article_for_type = article.for.enumValues
const getArticlePreview = (content: string) => content.replace(/\s+/g, ' ').trim().slice(0, 180)
const getArticleDedupKey = (args: { title: string | null; for_type: string; content_preview: string }) => {
	const title = (args.title || '').trim().toLowerCase()
	const preview = getArticlePreview(args.content_preview).toLowerCase()

	return `${args.for_type}::${title}::${preview}`
}

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/agent/searchArticles',
			summary: 'Read Search Articles'
		}
	})
	.input(
		object({
			agent_id: string(),
			for_type: zod_enum(article_for_type),
			query: string(),
			page: number().int().min(1).default(1)
		})
	)
	.query(async ({ input }) => {
		const keyword = input.query.trim()
		const page_size = 10
		const offset = (input.page - 1) * page_size

		if (!keyword) {
			return { list: [], has_more: false }
		}

		const related_rows = await env.db
			.select({ article_id: agent_article.article_id })
			.from(agent_article)
			.where(eq(agent_article.agent_id, input.agent_id))
		const exclude_ids = related_rows.map(item => item.article_id)
		const exclude_id_set = new Set(exclude_ids)
		const direct_where = [or(like(article.title, `%${keyword}%`), like(article.content, `%${keyword}%`))]

		if (exclude_ids.length > 0) {
			direct_where.push(notInArray(article.id, exclude_ids))
		}

		const direct_rows = await env.db
			.select({
				id: article.id,
				title: article.title,
				for_type: article.for,
				created_at: article.created_at,
				updated_at: article.updated_at,
				content_preview: article.content
			})
			.from(article)
			.where(and(...direct_where))
			.orderBy(desc(article.updated_at), asc(article.created_at))
			.limit(offset + page_size + 1)

		const merged_ids = direct_rows.map(row => row.id)
		const row_map = new Map(direct_rows.map(row => [row.id, row]))

		if (direct_rows.length <= offset + page_size) {
			const search_result = await fullTextSearch({
				query: keyword,
				intent: `${input.for_type} article search`,
				type: 'article',
				scope_type: 'global'
			})

			if (search_result.type === 'article' && search_result.results.length > 0) {
				const semantic_results = search_result.results.filter(
					item => !exclude_id_set.has(item.id) && !row_map.has(item.id)
				)

				if (semantic_results.length > 0) {
					const semantic_rows = await env.db
						.select({
							id: article.id,
							title: article.title,
							for_type: article.for,
							created_at: article.created_at,
							updated_at: article.updated_at
						})
						.from(article)
						.where(
							inArray(
								article.id,
								semantic_results.map(item => item.id)
							)
						)
					const semantic_row_map = new Map(semantic_rows.map(row => [row.id, row]))

					for (const item of semantic_results) {
						const row = semantic_row_map.get(item.id)

						if (!row) {
							continue
						}

						row_map.set(item.id, {
							...row,
							content_preview: item.content
						})
						merged_ids.push(item.id)
					}
				}
			}
		}

		const seen_keys = new Set<string>()
		const list = merged_ids.slice(offset, offset + page_size).flatMap(id => {
			const row = row_map.get(id)

			if (!row) {
				return []
			}

			const dedupe_key = getArticleDedupKey({
				title: row.title,
				for_type: row.for_type,
				content_preview: row.content_preview
			})

			if (seen_keys.has(dedupe_key)) {
				return []
			}

			seen_keys.add(dedupe_key)

			return [
				{
					id: row.id,
					title: row.title,
					for_type: row.for_type,
					created_at: row.created_at,
					updated_at: row.updated_at,
					content_preview: getArticlePreview(row.content_preview)
				}
			]
		})

		return {
			list,
			has_more: merged_ids.length > offset + page_size
		}
	})
