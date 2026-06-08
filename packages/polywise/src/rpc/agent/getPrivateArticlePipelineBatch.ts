import { object, string } from 'zod'

import { p } from '../../utils/trpc'
import { getAgentPrivateArticlePipelineBatchState } from './privateArticle'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/agent/getPrivateArticlePipelineBatch',
			description: 'Return the running state for one agent private article pipeline batch controller.'
		}
	})
	.input(
		object({
			agent_id: string()
		})
	)
	.query(async ({ input }) => getAgentPrivateArticlePipelineBatchState(input.agent_id))
