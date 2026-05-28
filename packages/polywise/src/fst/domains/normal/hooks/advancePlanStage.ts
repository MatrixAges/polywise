import { submit } from '../../../utils'

import type Session from '../../../session'
import type { DoneState } from '../../../session/core/types'

export default (s: Session, state: DoneState) => {
	if (state.mode !== 'default' || !state.wasRunning || s.mode !== 'plan-exec' || s.plan_stage !== 'plan') {
		return state
	}

	s.plan_stage = 'exec'

	setTimeout(() => {
		submit({ id: s.id }, 'Execute the plan.')
	}, 1200)

	return state
}
