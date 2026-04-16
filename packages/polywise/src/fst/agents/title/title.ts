import getTitlePrompt from '@core/consts/prompts/getTitlePrompt'

import extract from '../permission/extract'
import createTitleAgent from './agent'

import type Session from '../../session'
import type { TitleAgentOutput } from './agent'

const normalizeTitle = (value: string) => {
	return value
		.replace(/^['"`\s]+|['"`\s]+$/g, '')
		.replace(/\s+/g, ' ')
		.trim()
}

export default async (s: Session, focus: string) => {
	const agent = createTitleAgent(s.model.model)

	const recent_messages = s.model_messages.slice(-4).map(extract).filter(Boolean).join('\n')

	const res = await agent.generate({
		prompt: getTitlePrompt({
			recent_messages,
			title: s.session.title,
			focus,
			intent: s.context.intent
		})
	})
	const next_title = normalizeTitle((res.output as TitleAgentOutput)?.title || '')

	return next_title
}
