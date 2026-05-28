import { extract, getComplexitySignal } from '@core/fst/agents/superego'
import { hasSessionSubAgent } from '@core/fst/session/config/shared'

import type Session from '../../../session'
import type { DoneState } from '../../../session/core/types'

const modelThresholdValue = 12

export default async (s: Session, state: DoneState) => {
	if (hasSessionSubAgent(s, 'superego_agent')) {
		s.superego_append_count++

		if (state.responseMessage) {
			extract(
				s,
				getComplexitySignal({
					response_message: state.responseMessage,
					recent_message_count: s.model_messages.length
				})
			)
		} else {
			void extract(s)
		}
	} else {
		s.superego_append_count = 0
	}

	if (hasSessionSubAgent(s, 'trim_agent') && s.model_messages.length >= modelThresholdValue) {
		try {
			await s.trimMessages()
		} catch {}
	}

	return state
}
