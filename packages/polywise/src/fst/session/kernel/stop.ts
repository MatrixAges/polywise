import runHooks from '../hooks/runHooks'

import type Session from '../index'

export default async (s: Session) => {
	const last_ui_message = s.ui_messages.at(-1)

	if (last_ui_message && !last_ui_message.parts.length) {
		s.ui_messages.pop()
	}

	const last_model_message = s.model_messages.at(-1)

	if (last_model_message && !last_model_message.parts.length) {
		s.model_messages.pop()
	}

	await s.setRunning(false)
	await runHooks(s, 'onStop', {
		manual: s.manual_abort
	})
}
