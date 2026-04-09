import extract from '../permission/extract'

import type Session from '../../session'

export default (s: Session, focus: string) => {
	const recent_messages = s.model_messages.slice(-4).map(extract).filter(Boolean).join('\n')

	return [
		`Current session title: ${s.session.title}`,
		focus ? `Current topic focus: ${focus}` : '',
		s.context.intent ? `Context intent: ${s.context.intent}` : '',
		recent_messages ? `Recent messages:\n${recent_messages}` : '',
		'',
		'Generate one concise and accurate session title for the current user topic.',
		'The title must stay in the same language as the topic.',
		'Do not use quotation marks.',
		'Do not include explanation.',
		'Prefer a short phrase, not a full sentence.'
	]
		.filter(Boolean)
		.join('\n\n')
}
