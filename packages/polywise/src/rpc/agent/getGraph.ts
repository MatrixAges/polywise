import { array, boolean, object, string } from 'zod'

import { p } from '../../utils/trpc'
import { readAgentGraph } from './graph'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/agent/getGraph',
			description:
				'Return a circular-graph-friendly knowledge snapshot for one agent, including node details and optional neighborhood expansion.'
		}
	})
	.input(
		object({
			agent_id: string(),
			center_node_id: string().optional(),
			expand: boolean().optional(),
			visible_node_ids: array(string()).max(80).optional()
		})
	)
	.query(async ({ input }) => {
		return readAgentGraph(input)
	})
