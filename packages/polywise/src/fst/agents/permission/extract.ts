import type { UIMessage } from 'ai'

export default (message: UIMessage): string => {
	if (!Array.isArray(message.parts)) return ''

	const text_parts: Array<string> = []

	for (const part of message.parts) {
		if (part.type === 'text' && 'text' in part && typeof part.text === 'string') {
			text_parts.push(part.text)
		}
	}

	return text_parts.join('\n')
}
