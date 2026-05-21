import { agent_article, article } from '@core/db/schema'
import { env } from '@core/env'
import { and, asc, desc, eq, like, notInArray, or } from 'drizzle-orm'
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

		if (!keyword) {
			return { list: [], has_more: false }
		}

		const related_rows = await env.db
			.select({ article_id: agent_article.article_id })
			.from(agent_article)
			.where(eq(agent_article.agent_id, input.agent_id))
		const exclude_ids = related_rows.map(item => item.article_id)
		const page_size = 10
		const exclude_where = exclude_ids.length ? notInArray(article.id, exclude_ids) : undefined
		const search_where = or(like(article.title, `%${keyword}%`), like(article.content, `%${keyword}%`))
		const where = exclude_where
			? and(eq(article.for, input.for_type), exclude_where, search_where)
			: and(eq(article.for, input.for_type), search_where)

		const rows = await env.db
			.select({
				id: article.id,
				title: article.title,
				for_type: article.for,
				created_at: article.created_at,
				updated_at: article.updated_at,
				content_preview: article.content
			})
			.from(article)
			.where(where)
			.orderBy(desc(article.updated_at), asc(article.created_at))
			.limit(page_size + 1)
			.offset((input.page - 1) * page_size)

		const has_more = rows.length > page_size
		const list = (has_more ? rows.slice(0, page_size) : rows).map(row => ({
			id: row.id,
			title: row.title,
			for_type: row.for_type,
			created_at: row.created_at,
			updated_at: row.updated_at,
			content_preview: getArticlePreview(row.content_preview)
		}))

		return { list, has_more }
	})
