import type { Session } from '..'
import type { Message } from '../types'

const getTextParts = (message: Message) => {
	const text_parts = [] as Array<string>

	for (const part of message.parts) {
		if (part.type === 'text' && 'text' in part && typeof part.text === 'string') {
			text_parts.push(part.text)
		}
	}

	return text_parts.join('\n').trim()
}

interface GetTitleFocusArgs {
	s: Session
	message: Message
	is_first_message: boolean
}

export default ({ s, message, is_first_message }: GetTitleFocusArgs) => {
	if (s.session.is_runing || message.role !== 'user' || s.session.is_cron || !is_first_message) {
		return ''
	}

	return getTextParts(message)
}
