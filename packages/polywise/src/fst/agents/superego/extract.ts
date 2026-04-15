import { convertToModelMessages } from 'ai'

import createSuperegoAgent from './agent'

import type { UIMessageStreamWriter } from 'ai'
import type Session from '../../session'
import type { SuperegoEvent } from './types'

export default async (s: Session, writer: UIMessageStreamWriter) => {
	if (s.superego_append_count < 1) return

	console.log('-------------')
	console.log('extract')

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

		console.log(result)

		if (result.toolCalls.length === 0) {
			return
		}

		const actions = result.toolResults.map(tr => ({
			tool: tr.toolName,
			action: ((tr.input as Record<string, unknown>)?.action as string) || 'unknown',
			summary: typeof tr.output === 'string' ? tr.output.slice(0, 200) : JSON.stringify(tr.output)
		}))

		writer.write({
			type: 'data-superego_event',
			data: { type: 'extracted', actions, timestamp: Date.now() } as SuperegoEvent
		})
	} catch {
		writer.write({
			type: 'data-superego_event',
			data: { type: 'error', actions: [], timestamp: Date.now() } as SuperegoEvent
		})
	}
}
