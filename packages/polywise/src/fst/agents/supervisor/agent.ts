import getChaosPrompt from '@core/consts/prompts/getChaosPrompt'
import { Output, stepCountIs, ToolLoopAgent } from 'ai'
import { boolean, infer as Infer, object, string } from 'zod'

import type { LanguageModel } from 'ai'
import type Session from '../../session'

const schema = object({
	is_chaos: boolean().describe('Whether the agent is stuck in repetitive or circular behavior'),
	reason: string().describe('Explanation for the chaos detection decision')
})

export type ChaosDetectionOutput = Infer<typeof schema>

export default (model: LanguageModel, session: Session): ToolLoopAgent => {
	return new ToolLoopAgent({
		model,
		instructions: getChaosPrompt(session),
		output: Output.object({ schema }),
		stopWhen: stepCountIs(5)
	})
}
