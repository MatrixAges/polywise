import prompt from '@core/consts/prompts/skill_creator_prompt.md'
import { Output, stepCountIs, ToolLoopAgent } from 'ai'
import { array, enum as Enum, number, object, string } from 'zod'

import type { LanguageModel } from 'ai'
import type { SkillCreatorDraft } from '../superego/types'

const schema = object({
	action: Enum(['create', 'update', 'skip']).describe('Skill draft action'),
	reason: string().describe('Short explanation for the decision'),
	name: string().describe('Skill name or empty string when skipped'),
	description: string().describe('Progressive-disclosure description or empty string when skipped'),
	keywords: array(string()).default([]).describe('Keywords for related skill lookup'),
	content: string().describe('Full skill markdown content or empty string when skipped'),
	decision_basis: string().describe('Why the draft chose patching, creating, or skipping'),
	matched_skill_name: string().describe('Best matching existing skill name or empty string'),
	matched_skill_score: number().describe('Best matching existing skill score or zero when unavailable')
})

export default (model: LanguageModel): ToolLoopAgent => {
	return new ToolLoopAgent({
		model,
		instructions: prompt,
		output: Output.object({ schema }),
		stopWhen: stepCountIs(5)
	}) as unknown as ToolLoopAgent
}

export type SkillCreatorAgentOutput = SkillCreatorDraft
