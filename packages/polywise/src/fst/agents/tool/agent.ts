import { Output, stepCountIs, ToolLoopAgent } from 'ai'

import type { LanguageModel } from 'ai'
import type { ZodTypeAny } from 'zod'

interface CreateToolAgentArgs<TSchema extends ZodTypeAny> {
	instructions?: string
	max_steps?: number
	schema: TSchema
}

export default <TSchema extends ZodTypeAny>(
	model: LanguageModel,
	args: CreateToolAgentArgs<TSchema>
): ToolLoopAgent => {
	const { instructions = '', max_steps = 5, schema } = args

	return new ToolLoopAgent({
		model,
		instructions,
		output: Output.object({ schema }),
		stopWhen: stepCountIs(max_steps)
	})
}
