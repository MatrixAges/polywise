import { article } from '@core/db/schema'
import { number, object, string } from 'zod'

import { getAgentPrivateArticles } from '../../db/services/externals'
import { p } from '../../utils/trpc'

const article_for_type = article.for.enumValues

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/agent/getPrivateArticles',
			summary: 'List private articles owned by agent',
			description:
				'Return paginated private knowledge articles that belong to one agent. Optionally filter by article type.'
		}
	})
	.input(
		object({
			agent_id: string(),
			for_type: string().optional(),
			page: number().int().min(1).default(1),
			page_size: number().int().min(1).max(100).default(20)
		})
	)
	.query(async ({ input }) => {
		const target_for = article_for_type.includes((input.for_type || '') as (typeof article_for_type)[number])
			? input.for_type
			: undefined
		const rows = await getAgentPrivateArticles({
			agent_id: input.agent_id,
			for_type: target_for,
			limit: input.page_size + 1,
			offset: (input.page - 1) * input.page_size
		})
		const has_more = rows.length > input.page_size

		return {
			list: has_more ? rows.slice(0, input.page_size) : rows,
			has_more
		}
	})
