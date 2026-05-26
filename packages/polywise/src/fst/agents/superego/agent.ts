import prompt from '@core/consts/prompts/superego_prompt.md'
import { Output, stepCountIs, ToolLoopAgent } from 'ai'
import { array, enum as Enum, object, string } from 'zod'

import { createContentTool } from './content_tool'

import type { LanguageModel } from 'ai'
import type Session from '../../session'
import type { SessionScope } from '../../types'
import type { SuperegoResult } from './types'

const schema = object({
	summary: string().describe('Concise summary of what was extracted or why extraction was skipped'),
	actions: array(
		object({
			tool: Enum(['content_tool']).describe('Tool used by superego'),
			action: Enum(['add', 'search', 'update', 'remove']).describe(
				'Action applied during memory or knowledge extraction'
			),
			target: string().describe('Short description of the target memory or knowledge entry')
		})
	)
		.default([])
		.describe('Structured list of tool actions performed by superego')
})

export default (model: LanguageModel, _session: Session, scope: SessionScope): ToolLoopAgent => {
	return new ToolLoopAgent({
		model,
		instructions: prompt,
		output: Output.object({ schema }),
		tools: {
			content_tool: createContentTool(scope)
		},
		stopWhen: stepCountIs(20)
	}) as unknown as ToolLoopAgent
}

export type SuperegoAgentOutput = SuperegoResult
