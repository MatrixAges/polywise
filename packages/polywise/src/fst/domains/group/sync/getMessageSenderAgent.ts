import type Session from '../../../session'
import type { Message } from '../../../types'

export default (s: Session, message: Message) => {
	if (message.role !== 'assistant') {
		return null
	}

	const sender_id = message.metadata?.sender_id

	if (sender_id) {
		return s.agents.find(agent => agent.id === sender_id) ?? null
	}

	const sender_name = message.metadata?.sender

	if (sender_name) {
		return s.agents.find(agent => agent.name === sender_name) ?? null
	}

	return null
}
