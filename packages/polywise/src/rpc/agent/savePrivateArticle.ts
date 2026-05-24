import { object, string, enum as zod_enum } from 'zod'

import { p } from '../../utils/trpc'
import { savePrivateAgentArticle } from './privateArticle'

const private_article_for_type = ['linkcase', 'wiki', 'memory', 'user'] as const

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/agent/savePrivateArticle',
			summary: 'Run Save Private Article'
		}
	})
	.input(
		object({
			agent_id: string(),
			article_id: string().optional(),
			for_type: zod_enum(private_article_for_type),
			title: string().optional(),
			content: string()
		})
	)
	.mutation(async ({ input }) => {
		const article_item = await savePrivateAgentArticle({
			agent_id: input.agent_id,
			article_id: input.article_id,
			for_type: input.for_type,
			title: input.title,
			content: input.content
		})

		return article_item
	})
