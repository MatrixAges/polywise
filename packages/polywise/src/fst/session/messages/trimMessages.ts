import type Index from '../index'

export default async (s: Index) => {
	s.model_messages = s.model_messages.slice(4)

	if (s.archived_at !== null) {
		s.archived_at = null
		await s.setState()
	}
}
