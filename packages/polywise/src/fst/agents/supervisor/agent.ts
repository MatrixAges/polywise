import { Output, stepCountIs, ToolLoopAgent } from 'ai'
import { boolean, infer as Infer, object, string } from 'zod'

import type { LanguageModel } from 'ai'

const schema = object({
	is_chaos: boolean().describe('Whether the agent is stuck in repetitive or circular behavior'),
	reason: string().describe('Explanation for the chaos detection decision')
})

export type ChaosDetectionOutput = Infer<typeof schema>

export default (model: LanguageModel): ToolLoopAgent => {
	return new ToolLoopAgent({
		model,
		instructions:
			'You are a chaos detector. Analyze the provided assistant outputs and determine if the agent is stuck in chaotic behavior such as repeating itself, going in circles, or talking to itself without progress.',
		output: Output.object({ schema }),
		stopWhen: stepCountIs(5)
	})
}
