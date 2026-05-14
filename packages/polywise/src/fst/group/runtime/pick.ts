import getContextPrompt from '@core/consts/prompts/getContextPrompt'
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
		const system_prompt = [
			'# Group Candidate Pick Task',
			'You are routing the current user turn for a multi-agent group.',
			'Pick zero, one, or a few members who should enter self-evaluation for this turn.',
			'This is only a preselection step. Picked members will still evaluate for themselves later.',
			'Prefer the smallest candidate set that can plausibly own the turn.',
			'Order candidate_agent_ids from strongest owner to weakest backup.',
			'Do not pick every member unless the user explicitly asks for multiple perspectives, multiple named roles, a panel, or whole-team input.',
			'Do not pick a member just because they could add useful supporting details.',
			'Do not simulate answers. Do not produce user-facing content.',
			'When one member is the clearest owner, pick only that member.',
			`Group Name: ${s.group.name}`,
			s.group.description ? `Group Description: ${s.group.description}` : '',
			getAgentsMapPrompt(s, { include_description: true }),
			getContextPrompt(s.context)
		]
			.filter(Boolean)
			.join('\n\n')

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
