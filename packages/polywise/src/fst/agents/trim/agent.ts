import trim_agent_prompt from '@core/consts/prompts/trim_agent_prompt.md'
import { Output, stepCountIs, ToolLoopAgent } from 'ai'
import { boolean, object } from 'zod'

import { inputSchema } from '../../tools/context'

import type { LanguageModel } from 'ai'
import type { ContextInput } from '../../tools/context'

const schema = object({
	should_update: boolean().describe(
		'Whether the trimmed messages contain important context missing from the remaining messages'
	),
	update: inputSchema.optional().describe('Context fields to update. Omit fields that do not need changing.')
})

export type TrimAgentOutput = {
	should_update: boolean
	update?: ContextInput
}

export default (model: LanguageModel): ToolLoopAgent => {
	return new ToolLoopAgent({
		model,
		instructions: trim_agent_prompt,
		output: Output.object({ schema }),
		stopWhen: stepCountIs(5)
	})
}
