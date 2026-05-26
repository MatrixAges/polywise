import title_agent_prompt from '@core/consts/prompts/title_agent_prompt.md'
import { Output, stepCountIs, ToolLoopAgent } from 'ai'
import { infer as Infer, object, string } from 'zod'

import type { LanguageModel } from 'ai'

const schema = object({
	title: string().describe('A concise and accurate session title that matches the current user topic')
})

export type TitleAgentOutput = Infer<typeof schema>

export default (model: LanguageModel): ToolLoopAgent => {
	return new ToolLoopAgent({
		model,
		instructions: title_agent_prompt,
		output: Output.object({ schema }),
		stopWhen: stepCountIs(3)
	})
}
