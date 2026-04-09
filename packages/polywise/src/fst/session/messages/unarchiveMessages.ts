import type Index from '../index'

export default async (s: Index) => {
	s.archived_at = null

	await s.setState()
	await s.getMessages()

	s.sync()
}
