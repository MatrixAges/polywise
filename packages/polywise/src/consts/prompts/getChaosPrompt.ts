import extract from '@core/fst/agents/permission/extract'

import type Session from '@core/fst/session'

export default (s: Session) => {
	const recent_messages = s.model_messages.slice(-6).map(extract).filter(Boolean).join('\n')

	return [
		`Current session title: ${s.session.title}`,
		recent_messages ? `Recent messages:\n${recent_messages}` : '',
		'',
		'Analyze the recent messages and determine if the agent has陷入混乱（自言自语、重复说话、原地绕圈子等刻板行为）.',
		'Return a JSON object with is_chaos (boolean) and reason (string).'
	]
		.filter(Boolean)
		.join('\n\n')
}
