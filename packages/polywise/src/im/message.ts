import { getId } from 'stk/utils'

import type { Message as FstMessage } from '@core/fst/types'
import type { ImInboundEvent } from './types'

const getMessageText = (message: FstMessage) => {
	return message.parts
		.map(part => {
			if (part.type === 'text') return part.text
			return ''
		})
		.filter(Boolean)
		.join('')
}

export const buildImUserMessage = (event: ImInboundEvent): FstMessage => {
	const group_id =
		event.route.chat_type === 'dm'
			? undefined
			: event.route.thread_id || event.route.chat_id || event.route.guild_id || undefined
	const group_name = event.route.title || undefined

	return {
		id: getId(),
		role: 'user',
		parts: [{ type: 'text', text: event.message.text }],
		metadata: {
			timestamp: event.received_at,
			sender: event.sender.name || event.sender.id,
			sender_id: event.sender.id,
			group_id,
			group_name
		}
	}
}

export const extractAssistantText = (message?: FstMessage | null) => {
	if (!message || message.role !== 'assistant') return ''

	return getMessageText(message).trim()
}

export const parseImCommand = (text: string) => {
	const normalized = text.trim().toLowerCase()

	if (normalized === '/stop') return 'stop'
	if (normalized === '/reset' || normalized === '/new') return 'reset'

	return null
}
