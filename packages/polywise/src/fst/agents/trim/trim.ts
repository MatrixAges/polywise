import getTrimPrompt from '@core/consts/prompts/getTrimPrompt'

import extract from '../permission/extract'
import createTrimAgent from './agent'

import type Session from '../../session'
import type { Message } from '../../types'
import type { TrimAgentOutput } from './agent'

export default async (s: Session, trimmed_messages: Array<Message>, remaining_messages: Array<Message>) => {
	const agent = createTrimAgent(s.model.model)

	const trimmed_text = trimmed_messages.map(extract).filter(Boolean).join('\n')
	const remaining_text = remaining_messages.map(extract).filter(Boolean).join('\n')

	const prompt = getTrimPrompt({
		intent: s.context.intent,
		context: s.context.context,
		tasks: s.context.tasks?.length ? JSON.stringify(s.context.tasks, null, 2) : undefined,
		trimmed_text,
		remaining_text
	})
	const res = await agent.generate({ prompt })
	const output = res.output as TrimAgentOutput

	if (output?.should_update && output.update) {
		await s.setContext(output.update)
	}
}
