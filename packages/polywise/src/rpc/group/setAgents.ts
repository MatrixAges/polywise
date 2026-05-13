import { group_agent } from '@core/db/schema'
import { addGroupAgent, getGroupAgents, removeGroupAgent, setGroupAgent } from '@core/db/services'
import { and, eq } from 'drizzle-orm'
import { array, object, string } from 'zod'

import { p } from '../../utils/trpc'

const input_type = object({
	id: string(),
	agent_ids: array(string()).min(1)
})

export default p.input(input_type).mutation(async ({ input }) => {
	console.log('[group-debug][rpc.group.setAgents] input', {
		group_id: input.id,
		agent_ids_count: input.agent_ids.length,
		agent_ids: input.agent_ids
	})

	const current = await getGroupAgents({
		where: eq(group_agent.group_id, input.id)
	})

	const current_map = new Map(current.map(item => [item.agent.id, item.group_agent]))
	const next_ids = new Set(input.agent_ids)

	for (const item of current) {
		if (!next_ids.has(item.agent.id)) {
			console.log('[group-debug][rpc.group.setAgents] remove', {
				group_id: input.id,
				agent_id: item.agent.id
			})
			await removeGroupAgent(
				and(eq(group_agent.group_id, input.id), eq(group_agent.agent_id, item.agent.id))!
			)
		}
	}

	for (const [index, agent_id] of input.agent_ids.entries()) {
		const existing = current_map.get(agent_id)

		if (existing) {
			console.log('[group-debug][rpc.group.setAgents] reorder', {
				group_id: input.id,
				agent_id,
				order: index
			})
			await setGroupAgent(and(eq(group_agent.group_id, input.id), eq(group_agent.agent_id, agent_id))!, {
				order: index
			})
		} else {
			console.log('[group-debug][rpc.group.setAgents] add', {
				group_id: input.id,
				agent_id,
				order: index
			})
			await addGroupAgent(input.id, agent_id, index)
		}
	}

	const result = await getGroupAgents({
		where: eq(group_agent.group_id, input.id)
	})

	console.log('[group-debug][rpc.group.setAgents] result', {
		group_id: input.id,
		agent_count: result.length,
		agent_ids: result.map(item => item.agent.id)
	})

	return result
})
