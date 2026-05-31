import { object, string } from 'zod'

import { p } from '../../utils/trpc'
import { exportAgentPack } from './pack'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/agent/exportPack',
			description:
				'Export one agent and its portable assets, such as profile, skills, and related metadata, into an importable pack.'
		}
	})
	.input(
		object({
			agent_id: string()
		})
	)
	.mutation(async ({ input }) => exportAgentPack(input.agent_id))
