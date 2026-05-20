import getContextPrompt from '@core/consts/prompts/getContextPrompt'
import { getAgents } from '@core/db/services'
import { generateText, tool } from 'ai'
import dayjs from 'dayjs'
import { array, object, string, enum as zod_enum } from 'zod'

import getAgentModel from '../group/runtime/getAgentModel'

import type { Agent } from '@core/db'
import type Session from '../session'

const inputSchema = object({
	action: zod_enum(['search', 'ask']).default('ask'),
	query: string().trim().optional().describe('Search text for matching allowed agents'),
	prompt: string().trim().optional().describe('Question or task to send to the selected agents'),
	agent_ids: array(string().trim().min(1)).max(8).optional().describe('Optional explicit list of agent ids to call')
})

const getAgentProfilePrompt = (agent: Agent) =>
	[
		'# Target Agent Profile',
		`Name: ${agent.name}`,
		`Role: ${agent.role}`,
		agent.identity ? `Identity:\n${agent.identity}` : '',
		agent.soul ? `Soul:\n${agent.soul}` : '',
		agent.memory ? `Memory:\n${agent.memory}` : '',
		agent.prompt ? `Prompt:\n${agent.prompt}` : '',
		'Respond as this exact agent only.',
		'Do not narrate internal coordination. Answer the request directly from this agent perspective.'
	]
		.filter(Boolean)
		.join('\n\n')

const toSearchHaystack = (agent: Agent) =>
	[agent.id, agent.name, agent.role, agent.identity, agent.prompt].filter(Boolean).join('\n').toLowerCase()

const selectAllowedAgents = async (s: Session) => {
	const config_ids = Array.isArray(s.agent_ids) ? s.agent_ids : []
	const all_agents = await getAgents()

	if (!config_ids.length) {
		return all_agents
	}

	const id_set = new Set(config_ids)

	return all_agents.filter(agent => id_set.has(agent.id))
}

const matchAgents = (agents: Array<Agent>, args: { query?: string; agent_ids?: Array<string> }) => {
	const explicit_ids = Array.isArray(args.agent_ids) ? args.agent_ids : []

	if (explicit_ids.length) {
		const id_set = new Set(explicit_ids)
		return agents.filter(agent => id_set.has(agent.id))
	}

	const query = args.query?.trim().toLowerCase()

	if (!query) {
		return agents
	}

	return agents.filter(agent => toSearchHaystack(agent).includes(query))
}

export const createAgentTool = (s: Session) =>
	tool({
		description:
			'Search configured agents and ask one or more of them to answer a question from their own profile.',
		inputSchema,
		execute: async input => {
			const allowed_agents = await selectAllowedAgents(s)

			if (!allowed_agents.length) {
				return {
					agents: [],
					message: 'No agents are configured for agent_tool in this session.'
				}
			}

			const matched_agents = matchAgents(allowed_agents, input)

			if (input.action === 'search') {
				return {
					agents: matched_agents.map(agent => ({
						id: agent.id,
						name: agent.name,
						role: agent.role
					})),
					total_allowed: allowed_agents.length
				}
			}

			if (!input.prompt?.trim()) {
				throw new Error('agent_tool prompt is required for ask action')
			}

			if (!matched_agents.length) {
				throw new Error('No allowed agents matched the request')
			}

			const target_agents = matched_agents.slice(0, 5)
			const results = await Promise.all(
				target_agents.map(async agent => {
					const model = await getAgentModel(agent, { omit_effort: false })
					const response = await generateText({
						model: model.model,
						system: [
							getAgentProfilePrompt(agent),
							getContextPrompt(s.context),
							`Current Session Title: ${s.session.title}`,
							`Real World Date: ${dayjs().format('YYYY-MM-DD')}`
						]
							.filter(Boolean)
							.join('\n\n'),
						prompt: input.prompt!,
						providerOptions: model.provider_options
					})

					return {
						id: agent.id,
						name: agent.name,
						role: agent.role,
						answer: response.text
					}
				})
			)

			return {
				agents: results,
				truncated: matched_agents.length > target_agents.length
			}
		}
	})
