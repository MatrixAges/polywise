import createTrimAgent from './agent'
import getPrompt from './getPrompt'

import type Session from '../../session'
import type { Message } from '../../types'
import type { TrimAgentOutput } from './agent'

export default async (s: Session, trimmed_messages: Array<Message>, remaining_messages: Array<Message>) => {
	const agent = createTrimAgent(s.model.model)

	const prompt = getPrompt(s, trimmed_messages, remaining_messages)
	const res = await agent.generate({ prompt })
	const output = res.output as TrimAgentOutput

	if (output?.should_update && output.update) {
		await s.setContext(output.update)
	}
}
