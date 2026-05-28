import type { Message } from '../../../types'
import type Session from '../../index'

export default async (s: Session, message: Message) => {
	const total = s.context.total_messages_count ?? 0
	const isFirst = total === 0

	if (!s.session.is_runing) {
		s.resetAbort()
		s.context.total_messages_count = total + 1
		await s.insertMessage(message)
		s.model_messages.push(message)
		s.ui_messages.push(message)
	}

	s.context.current_messages_count = s.model_messages.length
	s.manual_abort = false

	return {
		total,
		isFirst
	}
}
