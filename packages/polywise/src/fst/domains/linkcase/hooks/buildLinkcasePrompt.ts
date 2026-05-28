import { config } from '@core/config'
import { global_linkcase_session_title } from '@core/consts'
import getLinkcaseSystemPrompt from '@core/consts/prompts/getLinkcaseSystemPrompt'
import { default_fetch_fallback_chain } from '@core/types'
import dayjs from 'dayjs'

import type Session from '../../../session'
import type { PromptState } from '../../../session/core/types'

export default (s: Session, state: PromptState) => {
	state.system = getLinkcaseSystemPrompt({
		session_title: s.session.title || global_linkcase_session_title,
		provider_chain:
			Array.isArray(config.fetch_fallback_chain) && config.fetch_fallback_chain.length
				? config.fetch_fallback_chain
				: [...default_fetch_fallback_chain],
		real_world_date: dayjs().format('YYYY-MM-DD')
	})
	state.titleFocus = ''

	return state
}
