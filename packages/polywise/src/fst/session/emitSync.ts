import type { ChatEventRes } from '../types'
import type Index from './index'

export default (s: Index) => {
	s.event.emit(`${s.id}/change`, {
		type: 'sync',
		data: {
			session: s.session,
			messages: s.ui_messages,
			context: s.context,
			has_older: s.ui_has_older,
			has_newer: s.ui_has_newer
		}
	} as ChatEventRes)
}
