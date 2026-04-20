import type { Message } from '../../types'
import type Index from '../index'

export default async (s: Index, v: Message) => {
	const total_messages_count = s.context.total_messages_count ?? 0

	s.model_messages.push(v)
	s.ui_messages.push(v)
	s.context.total_messages_count = total_messages_count + 1
	s.context.current_messages_count = s.model_messages.length

	if (s.ui_messages.length >= 20) {
		s.ui_messages = s.ui_messages.slice(10)
		s.ui_has_older = true
	}

	await s.insertMessage(v)

	if (s.archived_at !== null) {
		s.archived_at = null

		await s.setState()
	}
}
