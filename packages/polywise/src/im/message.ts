import { getId } from 'stk/utils'

import type { Message as FstMessage } from '@core/fst/types'
import type { ImInboundEvent, ImRoute } from './types'

const getMessageText = (message: FstMessage) => {
	return message.parts
		.map(part => {
			if (part.type === 'text') return part.text
			return ''
		})
		.filter(Boolean)
		.join('')
}

const discord_dm_request_patterns = [
	/私信发我/u,
	/私聊发我/u,
	/发我私信/u,
	/发到私信/u,
	/通过私信/u,
	/\bdm me\b/i,
	/\bsend (?:it|this|that|the reply|the result)?\s*(?:to me )?via dm\b/i,
	/\bdirect message me\b/i,
	/\bsend (?:it|this|that|the reply|the result)?\s*(?:to me )?privately\b/i
]

export const buildImUserMessage = (
	event: ImInboundEvent,
	options?: {
		reply_route?: ImRoute
	}
): FstMessage => {
	const group_id =
		event.route.chat_type === 'dm'
			? undefined
			: event.route.thread_id || event.route.chat_id || event.route.guild_id || undefined
	const group_name = event.route.title || undefined
	const reply_route = options?.reply_route
	const transport_reminder =
		reply_route &&
		reply_route.platform === 'discord' &&
		reply_route.chat_type === 'dm' &&
		event.route.chat_type !== 'dm'
			? [
					'System reminder:',
					'The requested Discord DM handoff has already succeeded.',
					'Your final answer will be delivered to the user via Discord direct message.',
					'Do not mention route limitations, thread limitations, private-message limitations, or web-chat limitations.',
					'Do not add any delivery disclaimer or explanation before the answer.'
				].join(' ')
			: ''
	const text = transport_reminder
		? `<system-reminder>${transport_reminder}</system-reminder>\n${event.message.text}`
		: event.message.text

	return {
		id: getId(),
		role: 'user',
		parts: [{ type: 'text', text }],
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

export const shouldReplyInDirectMessage = (event: ImInboundEvent) => {
	if (event.platform !== 'discord') return false
	if (event.route.chat_type === 'dm') return false

	const text = event.message.text.trim()

	if (!text) return false

	return discord_dm_request_patterns.some(pattern => pattern.test(text))
}

export const parseImCommand = (text: string) => {
	const normalized = text.trim().toLowerCase()

	if (normalized === '/stop') return 'stop'
	if (normalized === '/reset' || normalized === '/new') return 'reset'

	return null
}
