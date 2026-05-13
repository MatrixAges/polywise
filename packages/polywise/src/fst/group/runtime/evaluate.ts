import fst_system_prompt from '@core/consts/prompts/fst_system_prompt.md'
import getContextPrompt from '@core/consts/prompts/getContextPrompt'
import { generateObject } from 'ai'
import { boolean, enum as Enum, object, string } from 'zod'

import getAgentModel from './getAgentModel'

import type { Agent } from '@core/db'
import type { ModelMessage } from 'ai'
import type Group from '../index'
import type { GroupMemberEvaluation } from '../types'

const evaluation_schema = object({
	should_answer: boolean(),
	reason: string(),
	confidence: Enum(['low', 'medium', 'high']),
	leadership: Enum(['none', 'advisory', 'blocking']),
	needs_write_lock: boolean()
})

const getAgentProfilePrompt = (agent: Agent) =>
	[
		`Agent Name: ${agent.name}`,
		`Agent Role: ${agent.role}`,
		agent.identity ? `Identity:\n${agent.identity}` : '',
		agent.soul ? `Soul:\n${agent.soul}` : '',
		agent.memory ? `Memory:\n${agent.memory}` : '',
		agent.prompt ? `Prompt:\n${agent.prompt}` : ''
	]
		.filter(Boolean)
		.join('\n\n')

export default async (s: Group, agent: Agent, messages: Array<ModelMessage>) => {
	try {
		const model = await getAgentModel(agent)
		const system_prompt = [
			fst_system_prompt,
			'# Group Evaluation Task',
			'Decide whether you should respond to the current user turn as a member of a group.',
			'Silence is the default. Set should_answer=true only when you are one of the clearly best members to answer this turn.',
			'Only respond when you can add distinct value that is specific to your role, identity, expertise, responsibilities, or current execution state.',
			'If another member is more directly addressed, more clearly responsible, or obviously better positioned to answer, set should_answer=false.',
			'If the user is calling attendance, summoning a role, or asking for a specific perspective, only answer when that is clearly you.',
			'Do not answer just to acknowledge presence, agree, or restate what another likely member would say.',
			'If your likely response would be redundant, generic, low-information, or merely supportive, set should_answer=false.',
			'Prefer fewer responders. Multiple members should answer the same turn only when they are providing meaningfully different and necessary contributions.',
			'Use leadership=blocking only when your decision must land first because it changes the execution path, shared plan, or write strategy for the whole group.',
			'Use leadership=advisory when your answer is central but others do not need to wait.',
			'If the user explicitly addresses your exact role or your exact name, and you are the best direct match, set should_answer=true.',
			'If you need to edit files or run write-capable commands, set needs_write_lock=true.',
			`Group Name: ${s.group.name}`,
			s.group.description ? `Group Description: ${s.group.description}` : '',
			getAgentProfilePrompt(agent),
			getContextPrompt(s.context)
		]
			.filter(Boolean)
			.join('\n\n')

		const res = await generateObject({
			model: model.model,
			system: system_prompt,
			messages,
			schema: evaluation_schema,
			providerOptions: model.provider_options,
			abortSignal: s.abort_controller.signal
		})

		return {
			agent,
			...res.object
		} satisfies GroupMemberEvaluation
	} catch (error) {
		return {
			agent,
			should_answer: false,
			reason: error instanceof Error ? error.message : 'evaluation failed',
			confidence: 'low',
			leadership: 'none',
			needs_write_lock: false
		} satisfies GroupMemberEvaluation
	}
}
