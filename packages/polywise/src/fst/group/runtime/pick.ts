import getContextPrompt from '@core/consts/prompts/getContextPrompt'
import { getGroupPickPrompt } from '@core/consts/prompts/getGroupPrompt'
import { generateText, Output } from 'ai'
import { array, boolean, object, string } from 'zod'

import getAgentsMapPrompt from './getAgentsMapPrompt'

import type { ModelMessage } from 'ai'
import type Group from '../index'

const pick_schema = object({
	candidate_agent_ids: array(string()),
	reason: string(),
	is_fallback: boolean().optional()
})

export default async (s: Group, messages: Array<ModelMessage>) => {
	try {
		const agent_ids = new Set(s.agents.map(agent => agent.id))
		const system_prompt = getGroupPickPrompt({
			group_name: s.group.name,
			group_description: s.group.description,
			agents_map_prompt: getAgentsMapPrompt(s, { include_description: true }),
			context_prompt: getContextPrompt(s.context)
		})

		const res = await generateText({
			model: s.model.model,
			system: system_prompt,
			messages,
			output: Output.object({
				schema: pick_schema,
				name: 'group_candidate_pick',
				description: 'Ordered candidate members who should enter self-evaluation for this turn.'
			}),
			providerOptions: s.model.provider_options,
			abortSignal: s.abort_controller.signal
		})

		const candidate_agent_ids = res.output.candidate_agent_ids.filter(
			(agent_id, index, list) => agent_ids.has(agent_id) && list.indexOf(agent_id) === index
		)

		return {
			candidate_agent_ids,
			reason: res.output.reason,
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
