import { agent } from '@core/db/schema'
import { getAgents, setAgent } from '@core/db/services'
import { p } from '@core/utils'
import { eq } from 'drizzle-orm'
import { number, object } from 'zod'

import arrayMove from '../../utils/arrayMove'

const input_type = object({ from: number().int(), to: number().int() })

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/agent/sort',
			summary: 'Reorder agents',
			description: 'Move one agent from one index to another in the global agent list.'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		const agents = await getAgents()

		if (!agents[input.from] || input.to > agents.length - 1) {
			return agents
		}

		const next_agents = arrayMove({ list: agents, from: input.from, to: input.to })

		await Promise.all(next_agents.map((item, index) => setAgent(eq(agent.id, item.id), { order: index })))

		return next_agents
	})
