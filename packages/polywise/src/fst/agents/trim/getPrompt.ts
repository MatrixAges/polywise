import system_prompt from '@core/consts/prompts/trim_prompt.md'

import extract from '../permission/extract'

import type Session from '../../session'
import type { Message } from '../../types'

export default (s: Session, trimmed_messages: Array<Message>, remaining_messages: Array<Message>) => {
	const trimmed_text = trimmed_messages.map(extract).filter(Boolean).join('\n')
	const remaining_text = remaining_messages.map(extract).filter(Boolean).join('\n')

	const intent_text = s.context.intent ? `Current intent: ${s.context.intent}` : ''
	const context_text = s.context.context ? `Current context:\n${s.context.context}` : ''
	const tasks_text = s.context.tasks?.length ? `Current tasks:\n${JSON.stringify(s.context.tasks, null, 2)}` : ''

	return [
		system_prompt,
		'',
		'---',
		'',
		intent_text,
		context_text,
		tasks_text,
		trimmed_text ? `## Trimmed Messages\n${trimmed_text}` : '',
		remaining_text ? `## Remaining Messages\n${remaining_text}` : '',
		'',
		'Analyze the above and output the result as JSON.'
	]
		.filter(Boolean)
		.join('\n\n')
}
