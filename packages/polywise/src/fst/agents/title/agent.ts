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
		instructions:
			'Generate a concise and accurate session title for the current user topic. Keep the title in the same language as the user topic. Return only the title field. Do not use quotes. Do not add explanation. Prefer short noun phrases over full sentences.',
		output: Output.object({ schema }),
		stopWhen: stepCountIs(3)
	})
}
