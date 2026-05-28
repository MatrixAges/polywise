import getOwnerAgentPrompt from './getOwnerAgentPrompt'

import type Session from '../../../session'
import type { PromptState } from '../../../session/core/types'

export default (s: Session, state: PromptState) => {
	const prompt = getOwnerAgentPrompt(s)

	if (prompt) {
		state.parts.push(prompt)
	}

	return state
}
