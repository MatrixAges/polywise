import { boolean, object, string } from 'zod'

import { p } from '../../utils/trpc'
import { setAgentPrivateArticlePipelineBatchState } from './privateArticle'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/agent/setPrivateArticlePipelineBatch',
			description: 'Start or pause the private article pipeline batch controller for one agent.'
		}
	})
	.input(
		object({
			agent_id: string(),
			running: boolean()
		})
	)
	.mutation(async ({ input }) => setAgentPrivateArticlePipelineBatchState(input))
