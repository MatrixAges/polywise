import type { Message } from '../types'
import type Index from './index'

export default async (s: Index, v: Message) => {
	s.model_messages.push(v)
	s.ui_messages.push(v)

	if (s.ui_messages.length >= 20) {
		s.ui_messages = s.ui_messages.slice(10)
		s.ui_has_older = true
	}

	await s.insertMessage(v)
}
