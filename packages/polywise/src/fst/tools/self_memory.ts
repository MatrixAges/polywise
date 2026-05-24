import { agent } from '@core/db/schema'
import { assertAgentWritableForBehavior, setAgent } from '@core/db/services'
import { tool } from 'ai'
import { eq } from 'drizzle-orm'
import { enum as Enum, object, string } from 'zod'

import type Session from '../session'

const max_memory_length = 6000

const inputSchema = object({
	action: Enum(['set', 'append', 'clear']).describe(
		'The memory update to perform. set: replace the whole memory field. append: add a new memory block. clear: erase the memory field.'
	),
	memory: string()
		.max(max_memory_length)
		.optional()
		.describe(
			`[Required for set/append] The memory content to store in your own memory field. The final memory field must not exceed ${max_memory_length} characters in total.`
		)
})

const requireMemory = (action: 'set' | 'append', memory?: string) => {
	const next_memory = memory?.trim() ?? ''

	if (!next_memory) {
		throw new Error(`memory is required for ${action}`)
	}

	return next_memory
}

const assertMemoryLength = (memory: string) => {
	if (memory.length > max_memory_length) {
		throw new Error(`memory must not exceed ${max_memory_length} characters`)
	}
}

export const createSelfMemoryTool = (s: Session) => {
	return tool({
		description: [
			'Update your own agent memory field in the current agent session.',
			'Use this only for durable self-memory that should persist across future turns and sessions.',
			'Prefer concise, high-signal memory. Do not store temporary task state here.'
		].join('\n'),
		inputSchema,
		execute: async input => {
			if (!s.owner_agent) {
				return {
					updated: false,
					error: 'self_memory_tool is only available in agent sessions'
				}
			}

			await assertAgentWritableForBehavior(s.owner_agent.id)

			const previous_memory = s.owner_agent.memory ?? ''
			const next_memory = (() => {
				switch (input.action) {
					case 'set':
						return requireMemory('set', input.memory)
					case 'append': {
						const memory = requireMemory('append', input.memory)

						return previous_memory ? `${previous_memory}\n\n${memory}` : memory
					}
					case 'clear':
						return ''
				}
			})()

			assertMemoryLength(next_memory)
			const updated_agent = await setAgent(eq(agent.id, s.owner_agent.id), { memory: next_memory })

			if (updated_agent) {
				s.owner_agent = updated_agent
				s.agents = s.agents.map(item => (item.id === updated_agent.id ? updated_agent : item))
			} else {
				s.owner_agent = {
					...s.owner_agent,
					memory: next_memory
				}
			}

			return {
				updated: true,
				action: input.action,
				agent_id: s.owner_agent.id,
				previous_memory,
				memory: s.owner_agent.memory ?? '',
				memory_length: (s.owner_agent.memory ?? '').length
			}
		}
	})
}
