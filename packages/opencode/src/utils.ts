import type { AssistantMessage, Message, Part } from '@opencode-ai/sdk'

interface MessageItem {
	info: Message
	parts: Part[]
}

interface AssistantMessageItem {
	info: AssistantMessage
	parts: Part[]
}

export const getTextPart = (parts: Array<Part>) => {
	const targets = parts.filter((p): p is Part & { type: 'text'; text: string } => p.type === 'text')

	return targets.map(p => p.text).join('\n')
}

export const getLastAIMessages = (messages: Array<MessageItem>) => {
	const ai_messages: Array<AssistantMessageItem> = []

	for (let i = messages.length - 1; i >= 0; i--) {
		const current_msg = messages[i]

		if (current_msg.info.role === 'user') {
			break
		}

		ai_messages.push(current_msg as AssistantMessageItem)
	}

	return ai_messages.reverse()
}

export const getMetadata = (messages: Array<AssistantMessageItem>) => {
	const links_set = new Set<string>()
	const files_set = new Set<string>()
	let desc_arr: string[] = []

	messages.forEach(msg => {
		if (msg.parts && Array.isArray(msg.parts)) {
			msg.parts.forEach((part: any) => {
				if (part.type === 'text' && part.text) {
					desc_arr.push(part.text)
				}

				if (part.type === 'tool' && part.state && part.state.input) {
					const input = part.state.input

					if (input.url) {
						links_set.add(input.url)
					}

					if (input.filePath) {
						files_set.add(input.filePath)
					}
				}
			})
		}
	})

	if (!links_set.size && !files_set.size) return

	return {
		desc: desc_arr.join('\n'),
		links: Array.from(links_set),
		files: Array.from(files_set)
	}
}
