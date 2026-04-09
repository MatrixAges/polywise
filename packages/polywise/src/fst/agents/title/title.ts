import createTitleAgent from './agent'
import getPrompt from './getPrompt'

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

	const res = await agent.generate({ prompt: getPrompt(s, focus) })
	const next_title = normalizeTitle((res.output as TitleAgentOutput)?.title || '')

	return next_title
}
