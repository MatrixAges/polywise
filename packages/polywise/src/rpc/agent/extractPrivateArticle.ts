import { boolean, object, string } from 'zod'

import { p } from '../../utils/trpc'
import { triggerPrivateAgentArticleExtract } from './privateArticle'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/agent/extractPrivateArticle',
			description: 'Trigger extraction for one private article owned by one agent.'
		}
	})
	.input(
		object({
			agent_id: string(),
			article_id: string(),
			force: boolean().optional()
		})
	)
	.mutation(async ({ input }) => {
		return triggerPrivateAgentArticleExtract(input)
	})
