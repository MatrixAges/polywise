import { link_article } from '@core/db/schema'
import { getLinks } from '@core/db/services'
import { getLinkArticles } from '@core/db/services/externals'
import { inArray } from 'drizzle-orm'
import { number, object } from 'zod'

import { p } from '../../utils/trpc'

const page_size = 10

const input_type = object({
	page: number().int().min(1).default(1)
})

export default p.input(input_type).query(async ({ input }) => {
	const rows = await getLinks({
		limit: page_size + 1,
		offset: (input.page - 1) * page_size
	})
	const has_more = rows.length > page_size
	const items = has_more ? rows.slice(0, page_size) : rows
	const link_ids = items.map(item => item.id)
	const article_rows =
		link_ids.length > 0
			? await getLinkArticles({
					where: inArray(link_article.link_id, link_ids)
				})
			: []

	const article_map = article_rows.reduce(
		(total, item) => {
			if (!total[item.link_article.link_id]) {
				total[item.link_article.link_id] = []
			}

			total[item.link_article.link_id].push(item)

			return total
		},
		{} as Record<string, Array<(typeof article_rows)[number]>>
	)

	return {
		items: items.map(item => {
			const related_articles = article_map[item.id] ?? []
			const latest_article = related_articles[0]

			return {
				...item,
				article_count: related_articles.length,
				article: latest_article
					? {
							id: latest_article.article.id,
							title: latest_article.article.title,
							created_at: latest_article.article.created_at,
							updated_at: latest_article.article.updated_at,
							is_pipelined: latest_article.article.is_pipelined,
							fetched_at: latest_article.link_article.created_at
						}
					: null
			}
		}),
		has_more
	}
})
