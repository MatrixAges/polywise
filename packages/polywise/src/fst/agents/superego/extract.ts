import { convertToModelMessages } from 'ai'

import createSuperegoAgent from './agent'

import type Session from '../../session'
import type { SuperegoAgentOutput } from './agent'
import type { SuperegoEvent, SuperegoResult } from './types'

const getConversationFragment = async (s: Session) => {
	const model_messages = await convertToModelMessages(s.model_messages)

	return model_messages
		.map(message => {
			const content =
				typeof message.content === 'string' ? message.content : JSON.stringify(message.content)

			return `[${message.role}]: ${content}`
		})
		.join('\n\n')
}

const getSuperegoPrompt = (conversation: string) => {
	return [
		'Analyze the conversation fragment below.',
		'Apply the learning loop defined in your system instructions.',
		'Only store durable value.',
		'For skills, prefer search -> read -> create or update when a reusable workflow exists.',
		'',
		'---',
		'',
		conversation
	].join('\n')
}

const getSuperegoResult = (output: SuperegoAgentOutput | undefined, text: string): SuperegoResult => {
	if (output) {
		return {
			summary: output.summary || 'completed',
			actions: Array.isArray(output.actions) ? output.actions : []
		}
	}

	return {
		summary: text || 'completed',
		actions: []
	}
}

export default async (s: Session) => {
	if (s.superego_append_count < 3) return

	s.superego_append_count = 0

	const scope = s.scope
	const conversation = await getConversationFragment(s)

	const agent = createSuperegoAgent(s.model.model, s, scope)

	try {
		const result = await agent.generate({ prompt: getSuperegoPrompt(conversation) })
		const parsed = getSuperegoResult(result.output as SuperegoAgentOutput | undefined, result.text)

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
