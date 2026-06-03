import getContextPrompt from '@core/consts/prompts/getContextPrompt'
import { getGroupPickPrompt } from '@core/consts/prompts/getGroupPrompt'
import { generateText, Output } from 'ai'
import { array, boolean, object, string } from 'zod'

import getAgentsMapPrompt from './getAgentsMapPrompt'

import type { ModelMessage } from 'ai'
import type Session from '../../../session'

const pickSchema = object({
	candidate_agent_ids: array(string()),
	reason: string(),
	is_fallback: boolean().optional()
})

export default async (s: Session, messages: Array<ModelMessage>) => {
	try {
		const agentIds = new Set(s.agents.map(agent => agent.id))
		const systemPrompt = getGroupPickPrompt({
			group_name: s.group!.name,
			group_description: s.group!.description,
			agents_map_prompt: getAgentsMapPrompt(s, { include_description: true }),
			context_prompt: getContextPrompt(s.context)
		})

		const output = (
			await generateText({
				model: s.model.model,
				system: systemPrompt,
				messages,
				output: Output.object({
					schema: pickSchema,
					name: 'group_candidate_pick',
					description: 'Ordered candidate members who should enter self-evaluation for this turn.'
				}),
				providerOptions: s.model.provider_options,
				abortSignal: s.abort_controller.signal
			})
		).output

		const candidateAgentIds = output.candidate_agent_ids.filter(
			(agentId, index, list) => agentIds.has(agentId) && list.indexOf(agentId) === index
		)

		return {
			candidate_agent_ids: candidateAgentIds,
			reason: output.reason,
			is_fallback: false
		}
	} catch (error) {
		return {
			candidate_agent_ids: s.agents.map(agent => agent.id),
			reason: error instanceof Error ? error.message : 'pick failed',
			is_fallback: true
		}
	}
}
