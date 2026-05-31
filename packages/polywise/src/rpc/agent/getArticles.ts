import { article } from '@core/db/schema'
import { object, string } from 'zod'

import { getAgentArticles } from '../../db/services/externals'
import { p } from '../../utils/trpc'

const article_for_type = article.for.enumValues

const input_type = object({
	agent_id: string(),
	for_type: string().optional()
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/agent/getArticles',
			description: 'Return the articles already linked to an agent. Optionally filter by article type.'
		}
	})
	.input(input_type)
	.query(async ({ input }) => {
		const target_for = article_for_type.includes((input.for_type || '') as (typeof article_for_type)[number])
			? input.for_type
			: undefined

		const rows = await getAgentArticles({ agent_id: input.agent_id, for_type: target_for })

		return rows.map(item => item.article)
	})
