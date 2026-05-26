import chaos_detector_prompt from '@core/consts/prompts/chaos_detector_prompt.md'
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
		instructions: chaos_detector_prompt,
		output: Output.object({ schema }),
		stopWhen: stepCountIs(5)
	})
}
