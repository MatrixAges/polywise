import { trim } from '../../agents/trim'

import type Index from '../index'

export default async (s: Index) => {
	const trimmed_messages = s.model_messages.slice(0, 4)
	const remaining_messages = s.model_messages.slice(4)

	await trim(s, trimmed_messages, remaining_messages)

	s.model_messages = remaining_messages

	if (s.archived_at !== null) {
		s.archived_at = null

		await s.setState()
	}
}
