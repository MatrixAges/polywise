import { getAgentSessionPrompt } from '@core/consts/prompts/getAgentPrompt'

import type Session from '../../../session'

export default (s: Session) => {
	const agent = s.owner_agent

	if (!agent) {
		return ''
	}

	return getAgentSessionPrompt(agent)
}
