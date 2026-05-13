import fst_system_prompt from '@core/consts/prompts/fst_system_prompt.md'
import getContextPrompt from '@core/consts/prompts/getContextPrompt'
import { generateObject } from 'ai'
import { boolean, enum as Enum, object, string } from 'zod'

import getAgentModel from './getAgentModel'
import getAgentsMapPrompt from './getAgentsMapPrompt'

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
		console.log('[group-debug][evaluate] start', {
			session_id: s.id,
			group_id: s.group_id,
			turn_id: s.active_turn_id,
			agent_id: agent.id,
			agent_name: agent.name
		})
		const model = await getAgentModel(agent)
		const system_prompt = [
			fst_system_prompt,
			'# Group Evaluation Task',
			'Decide whether you should respond to the current user turn as a member of a group.',
			'Silence is the default. Set should_answer=true only when you are one of the clearly best members to answer this turn.',
			'Only respond when you can add distinct value that is specific to your role, identity, expertise, responsibilities, or current execution state.',
			`You are exactly ${agent.name} (${agent.role}). Never volunteer to answer as another member.`,
			'If another member is more directly addressed, more clearly responsible, or obviously better positioned to answer, set should_answer=false.',
			'If the user explicitly asks for a different member by name, or for a role that clearly belongs to another member in the group agents map, set should_answer=false.',
			'If the user is calling attendance, summoning a role, or asking for a specific perspective, only answer when that is clearly you.',
			'If your answer would mainly imitate a product manager, panel host, or whole-team spokesperson rather than your actual role, set should_answer=false.',
			'If your answer would mostly summarize what other members would say instead of giving your own role-specific perspective, set should_answer=false.',
			'Do not answer just to acknowledge presence, agree, or restate what another likely member would say.',
			'If your likely response would be redundant, generic, low-information, or merely supportive, set should_answer=false.',
			'Prefer fewer responders. Multiple members should answer the same turn only when they are providing meaningfully different and necessary contributions.',
			'Use leadership=blocking only when your decision must land first because it changes the execution path, shared plan, or write strategy for the whole group.',
			'Use leadership=advisory when your answer is central but others do not need to wait.',
			'If you need to edit files or run write-capable commands, set needs_write_lock=true.',
			`Group Name: ${s.group.name}`,
			s.group.description ? `Group Description: ${s.group.description}` : '',
			getAgentsMapPrompt(s),
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
		console.log('[group-debug][evaluate] success', {
			session_id: s.id,
			group_id: s.group_id,
			turn_id: s.active_turn_id,
			agent_id: agent.id,
			agent_name: agent.name,
			should_answer: res.object.should_answer,
			leadership: res.object.leadership,
			reason: res.object.reason
		})

		return {
			agent,
			...res.object
		} satisfies GroupMemberEvaluation
	} catch (error) {
		console.log('[group-debug][evaluate] error', {
			session_id: s.id,
			group_id: s.group_id,
			turn_id: s.active_turn_id,
			agent_id: agent.id,
			agent_name: agent.name,
			error: error instanceof Error ? error.message : String(error)
		})
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
