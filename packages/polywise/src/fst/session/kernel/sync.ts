import type { ChatEventRes } from '../../types'
import type Session from '../index'

export default (s: Session, data: ChatEventRes['data']) => {
	s.event.emit(`${s.id}/change`, {
		type: 'sync',
		data
	} as ChatEventRes)
}
