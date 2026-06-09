import { agent } from '@core/db/schema'
import { agent_update_input_schema } from '@core/db/schemas'
import { getAgentOrThrow, setAgent, setAgentFrozenState } from '@core/db/services'
import { p, SessionStore } from '@core/utils'
import { eq } from 'drizzle-orm'
import { omit } from 'es-toolkit'

import type { Agent, AgentInsert } from '@core/db'

const input_type = agent_update_input_schema

const syncLiveAgentSessions = async (agent_id: string, next_agent: Agent) => {
	for (const session of SessionStore.values()) {
		if (session.owner_agent?.id !== agent_id) {
			continue
		}

		session.owner_agent = next_agent
		await session.updateConfig()
		await session.loadCustomToolsMap()
	}
}

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/agent/update',
			description: 'Update one agent profile, including editable behavior fields and frozen state.'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		const target_agent = await getAgentOrThrow(input.id)
		const next_values = omit(input, ['id']) as Partial<AgentInsert>
		const behavior_keys = ['role', 'prompt', 'soul', 'identity', 'memory', 'tools', 'model'] as const
		const touches_behavior = behavior_keys.some(key => key in next_values)

		if (target_agent.is_frozen && touches_behavior) {
			throw new Error('Frozen agents cannot change behavior-driving state.')
		}

		if ('is_frozen' in next_values && typeof next_values.is_frozen === 'boolean') {
			const { is_frozen, ...rest } = next_values

			if (Object.keys(rest).length > 0) {
				await setAgent(eq(agent.id, input.id), rest)
			}

			const next_agent = await setAgentFrozenState(input.id, is_frozen)

			await syncLiveAgentSessions(input.id, next_agent)

			return next_agent
		}

		const next_agent = await setAgent(eq(agent.id, input.id), next_values)

		if (!next_agent) {
			throw new Error(`Agent not found: ${input.id}`)
		}

		await syncLiveAgentSessions(input.id, next_agent)

		return next_agent
	})
