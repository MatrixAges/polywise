import { convertToModelMessages } from 'ai'

import createSuperegoAgent from './agent'

import type Session from '../../session'
import type { SuperegoEvent } from './types'

export default async (s: Session) => {
	if (s.superego_append_count < 3) return

	s.superego_append_count = 0

	const scope = s.scope
	const model_messages = await convertToModelMessages(s.model_messages)

	const conversation = model_messages
		.map(m => {
			const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content)

			return `[${m.role}]: ${content}`
		})
		.join('\n\n')

	const agent = createSuperegoAgent(s.model.model, s, scope)

	try {
		const result = await agent.generate({
			prompt: `Analyze the following conversation fragment and extract memories, knowledge, and skills as appropriate.\n\n---\n\n${conversation}`
		})

		let parsed: { summary: string; actions: Array<{ tool: string; action: string; target: string }> }

		try {
			parsed = JSON.parse(result.text)
		} catch {
			parsed = { summary: result.text || 'completed', actions: [] }
		}

		s.event.emit(`${s.id}/change`, {
			type: 'superego',
			data: { result: JSON.stringify(parsed), timestamp: Date.now() } as SuperegoEvent
		})
	} catch {
		s.event.emit(`${s.id}/change`, {
			type: 'superego',
			data: {
				result: JSON.stringify({ summary: 'error', actions: [] }),
				timestamp: Date.now()
			} as SuperegoEvent
		})
	}
}
