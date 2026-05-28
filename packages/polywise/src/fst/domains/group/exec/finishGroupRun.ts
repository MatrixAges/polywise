import { SessionEventStore } from '@core/utils'

import runHooks from '../../../session/hooks/runHooks'
import releaseWriteLock from '../runtime/releaseWriteLock'
import setBarrier from '../runtime/setBarrier'

import type Session from '../../../session'
import type { Message } from '../../../types'

export default async (s: Session, message: Message) => {
	if (s.write_lock.agent_id) {
		const holder = s.agents.find(agent => agent.id === s.write_lock.agent_id)

		if (holder) {
			await releaseWriteLock(s, holder, true)
		}
	}

	await setBarrier(s, null)
	s.active_turn_id = null
	s.reply_queue = []
	await s.setState()
	await s.stop()

	if (!SessionEventStore.listenerCount(`${s.id}/change`)) {
		await s.updateSession({ unread: true })
	}

	s.manual_abort = false

	await runHooks(s, 'onDone', {
		message,
		mode: 'group'
	})
}
