import fst_system_prompt from '@core/consts/prompts/fst_system_prompt.md'
import getContextPrompt from '@core/consts/prompts/getContextPrompt'
import { generateText, Output } from 'ai'
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
	leadership: Enum(['none', 'advisory']),
	exclusive: boolean(),
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

const mergeAbortSignals = (...signals: Array<AbortSignal | undefined>) => {
	const active = signals.filter(Boolean) as Array<AbortSignal>

	if (!active.length) {
		return undefined
	}

	if (active.length === 1) {
		return active[0]
	}

	const controller = new AbortController()
	const abort = () => {
		if (!controller.signal.aborted) {
			controller.abort()
		}
	}

	for (const signal of active) {
		if (signal.aborted) {
			abort()
			break
		}

		signal.addEventListener('abort', abort, { once: true })
	}

	return controller.signal
}

export default async (s: Group, agent: Agent, messages: Array<ModelMessage>, args?: { abort_signal?: AbortSignal }) => {
	try {
		const model = await getAgentModel(agent, { omit_effort: true })
		const system_prompt = [
			fst_system_prompt,
			'# Group Evaluation Task',
			'Decide whether you should respond to the current user turn as a member of a group.',
			'Silence is the default. Set should_answer=true only when you are one of the clearly best members to answer this turn.',
			'For most turns, the ideal outcome is one responder, not a panel.',
			'Only respond when you can add distinct value that is specific to your role, identity, expertise, responsibilities, or current execution state.',
			`You are exactly ${agent.name} (${agent.role}). Never volunteer to answer as another member.`,
			'If another member is more directly addressed, more clearly responsible, or obviously better positioned to answer, set should_answer=false.',
			'If the user explicitly asks for a different member by name, or for a role that clearly belongs to another member in the group agents map, set should_answer=false.',
			'If the user is calling attendance, summoning a role, or asking for a specific perspective, only answer when that is clearly you.',
			'If the user asks for a broad owner-style perspective such as product, design, architecture, strategy, planning, or leadership, only the natural owner of that perspective should answer.',
			'Never treat a broad problem statement as an invitation for every specialist to join in.',
			'Never answer a role-owned question when that role is not clearly yours.',
			'Do not answer just because you can be helpful, relevant, or adjacent; answer only when you are the clearest owner of the requested perspective.',
			'Do not compete with a more natural owner on speed. If another member is the more obvious first responder, stay silent.',
			"Never reinterpret another role's request into your own specialty in order to justify answering.",
			'If one more relevant member can fully answer the turn without you, do not answer.',
			'If you are not that owner, set should_answer=false even if you could provide helpful supporting details.',
			'Specialists should stay silent unless explicitly requested, or unless missing their answer would leave a critical blind spot that the requested owner cannot reasonably cover.',
			'If you are unsure whether you are the best responder, choose silence and set should_answer=false.',
			'Do not answer broad exploratory prompts just because you can contribute; answer only if the prompt is actually yours to own.',
			'If your answer would mainly imitate a product manager, panel host, or whole-team spokesperson rather than your actual role, set should_answer=false.',
			'If your answer would mostly summarize what other members would say instead of giving your own role-specific perspective, set should_answer=false.',
			'Do not answer just to acknowledge presence, agree, or restate what another likely member would say.',
			'If your likely response would be redundant, generic, low-information, or merely supportive, set should_answer=false.',
			'Prefer fewer responders. Multiple members should answer the same turn only when they are providing meaningfully different and necessary contributions.',
			'Set exclusive=true only when this turn should be answered by you alone because you are the clearly requested or natural owner for the requested perspective.',
			'Set exclusive=false when the user explicitly wants multiple perspectives, a debate, a panel response, or whole-team input.',
			'If exclusive=true, then should_answer must also be true.',
			'Use leadership=advisory only when your answer is central but not exclusive.',
			'Use leadership=none for ordinary participation.',
			'If you need to edit files or run write-capable commands, set needs_write_lock=true.',
			`Group Name: ${s.group.name}`,
			s.group.description ? `Group Description: ${s.group.description}` : '',
			getAgentsMapPrompt(s, { include_description: false }),
			getAgentProfilePrompt(agent),
			getContextPrompt(s.context)
		]
			.filter(Boolean)
			.join('\n\n')

		const res = await generateText({
			model: model.model,
			system: system_prompt,
			messages,
			output: Output.object({
				schema: evaluation_schema,
				name: 'group_member_evaluation',
				description: 'Structured decision for whether this group member should answer now.'
			}),
			providerOptions: model.provider_options,
			abortSignal: mergeAbortSignals(s.abort_controller.signal, args?.abort_signal)
		})

		return {
			agent,
			...res.output
		} satisfies GroupMemberEvaluation
	} catch (error) {
		return {
			agent,
			should_answer: false,
			reason: error instanceof Error ? error.message : 'evaluation failed',
			confidence: 'low',
			leadership: 'none',
			exclusive: false,
			needs_write_lock: false
		} satisfies GroupMemberEvaluation
	}
}
