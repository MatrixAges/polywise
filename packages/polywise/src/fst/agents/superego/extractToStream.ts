import { convertToModelMessages } from 'ai'

import createSuperegoAgent from './agent'

import type { UIMessageStreamWriter } from 'ai'
import type Session from '../../session'
import type { SuperegoEvent } from './types'

type AgentResult = {
	toolCalls: Array<{ toolName: string; input: unknown }>
	toolResults: Array<{ toolName: string; input: unknown; output: unknown }>
}

export default async (s: Session, writer: UIMessageStreamWriter) => {
	const recent_msgs = s.model_messages.slice(-6)

	if (recent_msgs.length === 0) return

	const model_msgs = await convertToModelMessages(recent_msgs)

	const conv_history = model_msgs
		.map(m => `[${m.role}]: ${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`)
		.join('\n\n')

	const agent_instance = createSuperegoAgent(s.model.model, s, s.scope)

	try {
		const raw_res = await agent_instance.generate({
			prompt: `Analyze the following conversation fragment and extract memories, knowledge, and skills as appropriate.\n\n---\n\n${conv_history}`
		})

		if (raw_res.toolCalls.length === 0) {
			return { type: 'skipped' as const, actions: [], timestamp: Date.now() }
		}

		const action_items = raw_res.toolResults.map(tr => ({
			tool: tr.toolName,
			action: (tr.input as any)?.action || 'unknown',
			summary: typeof tr.output === 'string' ? tr.output.slice(0, 200) : JSON.stringify(tr.output)
		}))

		const event_data = { type: 'extracted' as const, actions: action_items, timestamp: Date.now() }

		if (event_data.actions.length > 0) {
			writer.write({ type: 'data-superego_event', data: event_data })
		}
	} catch (err_msg) {
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
