import { tool } from 'ai'
import { boolean, enum as Enum, object, string } from 'zod'

import type { Agent } from '@core/db'
import type Group from '../index'

const inputSchema = object({
	action: Enum(['list', 'get']).describe(
		'The action to perform. list: list members. get: load one member profile.'
	),
	agent_id: string().optional().describe('[Required for get] The target member id'),
	agent_name: string().optional().describe('[Optional for get] The target member name when id is not known'),
	include_context: boolean()
		.optional()
		.describe('[Optional for get] Include the member identity, soul, memory, and prompt fields')
})

const toMemberSummary = (agent: Agent) => ({
	id: agent.id,
	name: agent.name,
	role: agent.role,
	description: agent.description ?? null
})

const findAgent = (agents: Array<Agent>, input: { agent_id?: string; agent_name?: string }) => {
	if (input.agent_id) {
		return agents.find(agent => agent.id === input.agent_id) ?? null
	}

	if (input.agent_name) {
		return agents.find(agent => agent.name === input.agent_name) ?? null
	}

	return null
}

export const createGroupMemberTool = (s: Group, current_agent: Agent) =>
	tool({
		description: [
			'Inspect group members on demand.',
			'Use this instead of assuming or preloading every member profile into shared context.',
			'Use action "list" to see available members and action "get" to load a specific member profile.'
		].join('\n'),
		inputSchema,
		execute: async input => {
			if (input.action === 'list') {
				return {
					action: 'list' as const,
					members: s.agents.map(agent => ({
						...toMemberSummary(agent),
						is_self: agent.id === current_agent.id
					}))
				}
			}

			const target = findAgent(s.agents, input)

			if (!target) {
				return {
					action: 'get' as const,
					error: 'member not found'
				}
			}

			return {
				action: 'get' as const,
				member: {
					...toMemberSummary(target),
					is_self: target.id === current_agent.id,
					...(input.include_context
						? {
								identity: target.identity ?? null,
								soul: target.soul ?? null,
								memory: target.memory ?? null,
								prompt: target.prompt ?? null
							}
						: {})
				}
			}
		}
	})
