import { object, string } from 'zod'

import { p } from '../../utils/trpc'
import { exportAgentPack } from './pack'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/agent/exportPack',
			summary: 'Run Export Agent Pack'
		}
	})
	.input(
		object({
			agent_id: string()
		})
	)
	.mutation(async ({ input }) => exportAgentPack(input.agent_id))
