import { hasSessionSubAgent } from '@core/fst/session/config/shared'

import type Session from '../../../session'
import type { DoneState } from '../../../session/core/types'

const modelThresholdValue = 12

export default async (s: Session, state: DoneState) => {
	if (hasSessionSubAgent(s, 'trim_agent') && s.model_messages.length >= modelThresholdValue) {
		try {
			await s.trimMessages()
		} catch {}
	}

	return state
}
