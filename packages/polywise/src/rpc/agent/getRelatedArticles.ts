import { article } from '@core/db/schema'
import { object, string } from 'zod'

import { getAgentRelatedArticles } from '../../db/services/externals'
import { p } from '../../utils/trpc'

const article_for_type = article.for.enumValues

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/agent/getRelatedArticles',
			summary: 'Read Get Related Articles'
		}
	})
	.input(
		object({
			agent_id: string(),
			for_type: string().optional()
		})
	)
	.query(async ({ input }) => {
		const target_for = article_for_type.includes((input.for_type || '') as (typeof article_for_type)[number])
			? input.for_type
			: undefined

		return getAgentRelatedArticles({
			agent_id: input.agent_id,
			for_type: target_for
		})
	})
