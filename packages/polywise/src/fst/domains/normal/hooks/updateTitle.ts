import type Session from '../../../session'
import type { DoneState } from '../../../session/core/types'

export default (s: Session, state: DoneState) => {
	if (state.mode !== 'default' || !state.titleFocus) {
		return state
	}

	void s.updateTitle(state.titleFocus).catch(() => {})

	return state
}
