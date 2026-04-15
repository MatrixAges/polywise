import { convertToModelMessages } from 'ai'

import createSuperegoAgent from './agent'

import type { UIMessageStreamWriter } from 'ai'
import type Session from '../../session'
import type { SuperegoEvent } from './types'

const buildEventFromResult = (result: {
	toolCalls: Array<{ toolName: string; input: unknown }>
	toolResults: Array<{ toolName: string; input: unknown; output: unknown }>
}): SuperegoEvent => {
	if (result.toolCalls.length === 0) {
		return { type: 'skipped', actions: [], timestamp: Date.now() }
	}

	const actions = result.toolResults.map(tr => ({
		tool: tr.toolName,
		action: ((tr.input as Record<string, unknown>)?.action as string) || 'unknown',
		summary: typeof tr.output === 'string' ? tr.output.slice(0, 200) : JSON.stringify(tr.output)
	}))

	return { type: 'extracted', actions, timestamp: Date.now() }
}

export default async (s: Session, writer: UIMessageStreamWriter) => {
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

	try {
		const result = await agent.generate({
			prompt: `Analyze the following conversation fragment and extract memories, knowledge, and skills as appropriate.\n\n---\n\n${conversation}`
		})

		const event = buildEventFromResult(result)

		if (event.actions.length > 0) {
			writer.write({ type: 'data-superego_event', data: event })
		}
	} catch (error) {
		writer.write({
			type: 'data-superego_event',
			data: {
				type: 'error',
				actions: [],
				timestamp: Date.now()
			} as SuperegoEvent
		})
	}
}
