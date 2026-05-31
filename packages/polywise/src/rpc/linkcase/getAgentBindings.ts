import { object, string } from 'zod'

import { p } from '../../utils/trpc'
import { getLinkcaseAgentBindings } from './agentBindings'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/linkcase/getAgentBindings',
			description: 'Read Linkcase Agent Bindings'
		}
	})
	.input(
		object({
			link_id: string()
		})
	)
	.query(async ({ input }) => getLinkcaseAgentBindings(input.link_id))
