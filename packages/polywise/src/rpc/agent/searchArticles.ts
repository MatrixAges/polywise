import { agent_article, article } from '@core/db/schema'
import { env } from '@core/env'
import { fullTextSearch } from '@core/io'
import { eq, inArray } from 'drizzle-orm'
import { number, object, string, enum as zod_enum } from 'zod'

import { p } from '../../utils/trpc'

const article_for_type = article.for.enumValues
const getArticlePreview = (content: string) => content.replace(/\s+/g, ' ').trim().slice(0, 180)

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

		if (!keyword) {
			return { list: [], has_more: false }
		}

		const related_rows = await env.db
			.select({ article_id: agent_article.article_id })
			.from(agent_article)
			.where(eq(agent_article.agent_id, input.agent_id))
		const exclude_id_set = new Set(related_rows.map(item => item.article_id))
		const search_result = await fullTextSearch({
			query: keyword,
			intent: `${input.for_type} article search`,
			type: 'article',
			for_types: [input.for_type],
			scope_type: 'global'
		})

		if (search_result.type !== 'article' || search_result.results.length === 0) {
			return { list: [], has_more: false }
		}

		const filtered_results = search_result.results.filter(item => !exclude_id_set.has(item.id))
		const offset = (input.page - 1) * page_size
		const page_results = filtered_results.slice(offset, offset + page_size)

		if (page_results.length === 0) {
			return { list: [], has_more: false }
		}

		const rows = await env.db
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
					page_results.map(item => item.id)
				)
			)

		const row_map = new Map(rows.map(row => [row.id, row]))
		const list = page_results.flatMap(item => {
			const row = row_map.get(item.id)

			if (!row) {
				return []
			}

			return [
				{
					id: row.id,
					title: row.title,
					for_type: row.for_type,
					created_at: row.created_at,
					updated_at: row.updated_at,
					content_preview: getArticlePreview(item.content)
				}
			]
		})

		return {
			list,
			has_more: filtered_results.length > offset + page_size
		}
	})
