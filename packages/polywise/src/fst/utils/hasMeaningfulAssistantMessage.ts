import type { Message } from '../types'

const hasMeaningfulPart = (part: Message['parts'][number]) => {
	if (part.type === 'step-start' || part.type === 'data-part-duration') {
		return false
	}

	if ((part.type === 'text' || part.type === 'reasoning') && typeof part.text === 'string') {
		return part.text.trim().length > 0
	}

	return true
}

export default (message?: Message | null) => {
	if (!message || message.role !== 'assistant') {
		return false
	}

	return message.parts.some(hasMeaningfulPart)
}
