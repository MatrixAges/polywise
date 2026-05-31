import { group_agent } from '@core/db/schema'
import { addGroupAgent, getGroupAgents, removeGroupAgent, setGroupAgent } from '@core/db/services'
import { and, eq } from 'drizzle-orm'
import { array, object, string } from 'zod'

import { p } from '../../utils/trpc'

const input_type = object({
	id: string(),
	agent_ids: array(string()).min(1)
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/group/setAgents',
			description: 'Replace and reorder the agents assigned to a group.'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		const current = await getGroupAgents({
			where: eq(group_agent.group_id, input.id)
		})

		const current_map = new Map(current.map(item => [item.agent.id, item.group_agent]))
		const next_ids = new Set(input.agent_ids)

		for (const item of current) {
			if (!next_ids.has(item.agent.id)) {
				await removeGroupAgent(
					and(eq(group_agent.group_id, input.id), eq(group_agent.agent_id, item.agent.id))!
				)
			}
		}

		for (const [index, agent_id] of input.agent_ids.entries()) {
			const existing = current_map.get(agent_id)

			if (existing) {
				await setGroupAgent(
					and(eq(group_agent.group_id, input.id), eq(group_agent.agent_id, agent_id))!,
					{
						order: index
					}
				)
			} else {
				await addGroupAgent(input.id, agent_id, index)
			}
		}

		return getGroupAgents({
			where: eq(group_agent.group_id, input.id)
		})
	})
