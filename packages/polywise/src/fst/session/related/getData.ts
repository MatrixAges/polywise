import type { ChatEventRes } from '../../types'
import type Index from '../index'

export default async (s: Index) => {
	s.active()

	await Promise.all([s.getModel(), s.getAgents(), s.getMessages()])

	return {
		type: 'init',
		data: {
			session: s.session,
			messages: s.ui_messages,
			context: s.context,
			has_older: s.ui_has_older,
			has_newer: s.ui_has_newer
		}
	} as ChatEventRes
}
