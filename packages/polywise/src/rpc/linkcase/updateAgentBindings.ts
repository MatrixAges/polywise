import { array, object, string } from 'zod'

import { p } from '../../utils/trpc'
import { updateLinkcaseAgentBindings } from './agentBindings'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/linkcase/updateAgentBindings',
			description: 'Update Linkcase Agent Bindings'
		}
	})
	.input(
		object({
			link_id: string(),
			assigned_agent_id: string().optional(),
			related_agent_ids: array(string()).default([])
		})
	)
	.mutation(async ({ input }) =>
		updateLinkcaseAgentBindings({
			link_id: input.link_id,
			assigned_agent_id: input.assigned_agent_id,
			related_agent_ids: input.related_agent_ids
		})
	)
