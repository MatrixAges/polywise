import fst_post_system_prompt from '@core/consts/prompts/fst_post_system_prompt.md'
import fst_system_prompt from '@core/consts/prompts/fst_system_prompt.md'
import dayjs from 'dayjs'

import type Session from '../../../session'
import type { PromptState } from '../../../session/core/types'

export default (s: Session, state: PromptState) => {
	if (!state.tools.linkedPost) {
		return state
	}

	const linkedPost = state.tools.linkedPost

	state.system = [
		fst_system_prompt,
		fst_post_system_prompt,
		(state.tools.runtime as any)?.prompt_injection_prompt ?? '',
		`Current Session Title: ${s.session.title}`,
		[
			`Current Post Title: ${linkedPost.article.title ?? ''}`,
			`Current Post Type: ${linkedPost.article.for}`,
			`Current Post ID: ${linkedPost.article.id}`
		].join('\n'),
		s.getContextPrompt(),
		`Real World Date: ${dayjs().format('YYYY-MM-DD')}`
	]
		.filter(Boolean)
		.join('\n\n')
	state.titleFocus = ''

	return state
}
