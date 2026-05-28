import { syncTodoSessionStatusBySessionId } from '@core/db/services'
import { SessionEventStore } from '@core/utils'

import { emitChange } from '../../../utils'
import hasMeaningfulAssistantMessage from '../../../utils/hasMeaningfulAssistantMessage'
import runHooks from '../../hooks/runHooks'

import type { Message, MessageMetadata, MessagePartDurationUIPart } from '../../../types'
import type Session from '../../index'

export default async (args: {
	s: Session
	message: Message
	responseMessage: Message
	durationParts: Array<MessagePartDurationUIPart>
	titleFocus: string
	wasRunning: boolean
}) => {
	const { s, message, responseMessage, durationParts, titleFocus, wasRunning } = args
	const timestamp = Date.now()

	if (durationParts.length > 0) {
		responseMessage.parts = [...responseMessage.parts, ...durationParts]
	}

	responseMessage.metadata = {
		...(responseMessage.metadata ?? {}),
		timestamp
	} as MessageMetadata

	await syncTodoSessionStatusBySessionId({
		session_id: s.id,
		from_status_list: ['processing'],
		to_status: 'unreview'
	})
	await s.stop()
	const has_meaningful_response = hasMeaningfulAssistantMessage(responseMessage)

	if (has_meaningful_response) {
		await s.appendMessage(responseMessage)
	}

	s.manual_abort = false

	await runHooks(s, 'onDone', {
		message,
		mode: 'default',
		responseMessage,
		titleFocus,
		wasRunning
	})

	if (has_meaningful_response && !SessionEventStore.listenerCount(`${s.id}/change`)) {
		const session = await s.updateSession({ unread: true })
		await emitChange({
			session,
			running_since: s.running_since,
			running_done: session.running_done ?? null
		})
	}
}
