import getSkillCreatorDraftPrompt from '@core/consts/prompts/getSkillCreatorDraftPrompt'
import { createSkillCreatorAgent } from '@core/fst/agents/skill_creator'

import type Session from '../../session'
import type { PatchRecord } from '../../telemetry'
import type { ComplexitySignal, SkillCreatorDraft } from '../superego/types'
import type { SkillCreatorAgentOutput } from './agent'

export default async (args: {
	session: Session
	conversation: string
	complexity_signal: ComplexitySignal
	failure_telemetry: PatchRecord | null
	related_failures: Array<string>
	related_skill_name: string
	related_skill_score: number
	related_skill: string
	patch_priority: 'observe' | 'patch' | 'escalate'
	existing_skill_preferred_action: 'observe' | 'update' | 'create'
}) => {
	const {
		session,
		conversation,
		complexity_signal,
		failure_telemetry,
		related_failures,
		related_skill_name,
		related_skill_score,
		related_skill,
		patch_priority,
		existing_skill_preferred_action
	} = args
	const preferred_action =
		(patch_priority === 'patch' || patch_priority === 'escalate') && related_skill_name
			? 'update'
			: existing_skill_preferred_action

	const agent = createSkillCreatorAgent(session.model.model)
	const res = await agent.generate({
		prompt: getSkillCreatorDraftPrompt({
			conversation,
			complexity_signal,
			failure_telemetry,
			related_failures,
			related_skill_name,
			related_skill_score,
			related_skill,
			patch_priority,
			existing_skill_preferred_action: preferred_action
		})
	})

	const output = res.output as SkillCreatorAgentOutput | undefined
	const draft = {
		action: output?.action || 'skip',
		reason: output?.reason || 'no skill draft produced',
		name: output?.name || '',
		description: output?.description || '',
		keywords: Array.isArray(output?.keywords) ? output?.keywords : [],
		content: output?.content || '',
		decision_basis: output?.decision_basis || '',
		matched_skill_name: output?.matched_skill_name || related_skill_name || '',
		matched_skill_score: output?.matched_skill_score || related_skill_score || 0
	} as SkillCreatorDraft

	if ((patch_priority === 'patch' || patch_priority === 'escalate') && related_skill_name) {
		draft.action = draft.action === 'skip' ? 'skip' : 'update'
		draft.matched_skill_name = related_skill_name
		draft.matched_skill_score = related_skill_score

		if (!draft.decision_basis) {
			draft.decision_basis = 'Patch priority forced update because a related local skill already exists.'
		}
	}

	return draft
}
