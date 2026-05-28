import runHooks from '../hooks/runHooks'

import type { Message } from '../../types'
import type Session from '../index'

export default async (s: Session, message: Message) => {
	await runHooks(s, 'onAccept', {
		message
	})

	return s.caps.exec(s, message)
}
