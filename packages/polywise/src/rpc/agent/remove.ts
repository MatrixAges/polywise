import { agent } from '@core/db/schema'
import { removeAgent } from '@core/db/services'
import { p } from '@core/utils'
import { eq } from 'drizzle-orm'
import fs from 'fs-extra'
import { object, string } from 'zod'

import { getAgentDirPath } from './utils'

const input_type = object({ id: string() })

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/agent/remove',
			summary: 'Delete agent',
			description: 'Remove one agent and delete its local agent directory.'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		const next_agent = await removeAgent(eq(agent.id, input.id))

		await fs.remove(getAgentDirPath(input.id))

		return next_agent
	})
