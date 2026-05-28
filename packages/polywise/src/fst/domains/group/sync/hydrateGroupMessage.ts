import getMessageSenderAgent from './getMessageSenderAgent'

import type Session from '../../../session'
import type { Message } from '../../../types'

export default (s: Session, message: Message) => {
	if (message.role !== 'assistant') {
		return message
	}

	const sender = getMessageSenderAgent(s, message)

	if (!sender) {
		return message
	}

	const metadata = {
		...message.metadata,
		sender: sender.name,
		sender_id: message.metadata?.sender_id ?? sender.id,
		sender_role: sender.role
	}

	if (
		message.metadata?.sender === metadata.sender &&
		message.metadata?.sender_id === metadata.sender_id &&
		message.metadata?.sender_role === metadata.sender_role
	) {
		return message
	}

	return {
		...message,
		metadata
	}
}
