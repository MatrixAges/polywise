import type { AssistantMessage, Message, Part } from '@opencode-ai/sdk'

interface MessageItem {
	info: Message
	parts: Part[]
}

interface AssistantMessageItem {
	info: AssistantMessage
	parts: Part[]
}

export const hasForget = (messages: Array<MessageItem>) => {
	return messages.some(session => {
		return session.parts.some(
			part => part.type === 'tool' && part.tool === 'polywise' && part.state?.input?.action === 'forget'
		)
	})
}

export const getTextPart = (parts: Array<Part>) => {
	const targets = parts.filter((p): p is Part & { type: 'text'; text: string } => p.type === 'text')

	return targets.map(p => p.text).join('\n')
}

export const getLastAIMessages = (messages: Array<MessageItem>) => {
	let user_prompt = ''
	const ai_messages: Array<AssistantMessageItem> = []

	for (let i = messages.length - 1; i >= 0; i--) {
		const current_msg = messages[i]

		if (current_msg.info.role === 'user') {
			user_prompt = getTextPart(current_msg.parts)

			break
		}

		ai_messages.push(current_msg as AssistantMessageItem)
	}

	if (user_prompt === '') return

	ai_messages.reverse()

	return { user_prompt, ai_messages }
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

export const tool_desc = `
Used to manage users' long-term persistent memories:
- Use 'save' when a user asks you to "remember," "save," or mentions important personal information.
- When using 'save', you must summarize the facts to be remembered in the 'content' field.
- Use 'query' when a user asks "Who am I?", "What do you remember about me?", or mentions relevant background information.
- When using 'query', enter search keywords in the 'query' field.
- When using 'forget', should enter search keywords in the 'query' field.
- 'memory_id' is only used for memory entries that already exist ('update' or 'forget').
`

export const getQa = (q: string, a: string) => {
	return `The following is a previous interaction for your reference:
---
User: 
${q}
---
AI: 
${a}
---`
}
