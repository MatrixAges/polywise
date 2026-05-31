import { agent } from '@core/db/schema'
import { agent_update_input_schema } from '@core/db/schemas'
import { getAgentOrThrow, setAgent, setAgentFrozenState } from '@core/db/services'
import { p } from '@core/utils'
import { eq } from 'drizzle-orm'
import { omit } from 'es-toolkit'

import type { AgentInsert } from '@core/db'

const input_type = agent_update_input_schema

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/agent/update',
			summary: 'Update agent profile',
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

			return setAgentFrozenState(input.id, is_frozen)
		}

		return setAgent(eq(agent.id, input.id), next_values)
	})
