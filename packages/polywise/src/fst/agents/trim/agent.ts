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
		instructions:
			'You are a session context analyst. Analyze the trimmed messages, remaining messages, and current context. If the trimmed messages contain crucial information missing from the remaining messages and current context, output the necessary context updates. Otherwise, set should_update to false. Be concise.',
		output: Output.object({ schema }),
		stopWhen: stepCountIs(5)
	})
}
