import getContextPrompt from '@core/consts/prompts/getContextPrompt'
import { getGroupEvaluatePrompt } from '@core/consts/prompts/getGroupPrompt'
import { generateText, Output } from 'ai'
import { boolean, enum as Enum, object, string } from 'zod'

import getAgentModel from './getAgentModel'
import getAgentsMapPrompt from './getAgentsMapPrompt'

import type { Agent } from '@core/db'
import type { ModelMessage } from 'ai'
import type Session from '../../../session'
import type { GroupMemberEvaluation } from '../types'

const evaluationSchema = object({
	should_answer: boolean(),
	reason: string(),
	confidence: Enum(['low', 'medium', 'high']),
	leadership: Enum(['none', 'advisory']),
	exclusive: boolean(),
	needs_write_lock: boolean()
})

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

export default async (
	s: Session,
	agent: Agent,
	messages: Array<ModelMessage>,
	args?: { abort_signal?: AbortSignal }
) => {
	try {
		const model = await getAgentModel(agent, { omit_effort: true })
		const systemPrompt = getGroupEvaluatePrompt({
			agent,
			group_name: s.group!.name,
			group_description: s.group!.description,
			agents_map_prompt: getAgentsMapPrompt(s, { include_description: false }),
			context_prompt: getContextPrompt(s.context)
		})

		const res = await generateText({
			model: model.model,
			system: systemPrompt,
			messages,
			output: Output.object({
				schema: evaluationSchema,
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
