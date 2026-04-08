import permission_system_prompt from '@core/consts/prompts/permission_system_prompt.md'
import { Output, stepCountIs, ToolLoopAgent } from 'ai'
import { boolean, infer as Infer, object } from 'zod'

import type { LanguageModel } from 'ai'

const schema = object({ approved: boolean().describe('Whether the provided content is considered safe') })

export type AuditAgentOutput = Infer<typeof schema>

export default (model: LanguageModel): ToolLoopAgent => {
	return new ToolLoopAgent({
		model,
		instructions: permission_system_prompt,
		output: Output.object({ schema }),
		stopWhen: stepCountIs(5)
	})
}
