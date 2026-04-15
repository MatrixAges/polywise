import { convertToModelMessages } from 'ai'

import createSuperegoAgent from './agent'

import type Session from '../../session'

export default async (s: Session) => {
	const scope = s.scope
	const recent_messages = s.model_messages.slice(-6)

	if (recent_messages.length === 0) {
		return
	}

	const model_messages = await convertToModelMessages(recent_messages)

	const conversation = model_messages
		.map(m => {
			const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content)

			return `[${m.role}]: ${content}`
		})
		.join('\n\n')

	const agent = createSuperegoAgent(s.model.model, s, scope)

	await agent.generate({
		prompt: `Analyze the following conversation fragment and extract memories, knowledge, and skills as appropriate.\n\n---\n\n${conversation}`
	})
}
