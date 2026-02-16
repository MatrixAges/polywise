import { streamText } from 'ai'
import to from 'await-to-js'
import { container } from 'tsyringe'

import Provider from './Provider'
import Session from './Session'
import getTools from './Tools'
import { getId } from './utils'

import type { LanguageModel } from 'ai'
import type { ShadowContext } from './types/shadow'

export default class Fst {
	private provider = container.resolve(Provider)
	private session = container.resolve(Session)

	conversation_id = getId()

	public async init() {
		await this.provider.init()

		const [err] = await to(this.session.init(this.conversation_id))
		if (err) console.error('Fst init error:', err)
	}

	public async think(user_input: string) {
		await to(
			this.session.addMessage({
				id: getId(),
				role: 'user',
				content: user_input
			})
		)

		const shadow = this.session.getShadowContext()
		const [err, history] = await to(this.session.getLastMessages(6))

		const tools = getTools({
			cwd: process.cwd(),
			sessions: this.session
		})

		return streamText({
			model: this.provider.getLanguageModel() as unknown as LanguageModel,
			system: this.getSystemPrompt(shadow),
			messages: err ? [] : history,
			tools,
			maxSteps: 10,
			onFinish: async ({ text }) => {
				await to(
					this.session.addMessage({
						id: getId(),
						role: 'assistant',
						content: text
					})
				)
			}
		})
	}

	private getSystemPrompt(shadow: ShadowContext) {
		return `You are a Full Self Thinking (FST) Agent.

# Shadow Context (Global Persistent State)
${JSON.stringify(shadow, null, 2)}

# Environment
- Messages are saved individually as JSON files in 'conversations/${this.conversation_id}/messages/'.
- Each file contains a single message: { id, role, content }.
- You only see the LAST 6 messages in your immediate context.

# Core Instructions
1. **State Maintenance**: You MUST call 'update_context' whenever:
   - A new task is identified or a task's status changes.
   - You gain significant knowledge that should be summarized.
   - You need to track a new file in 'refs'.
2. **Context Retrieval**: If you need to know what happened before the last 6 messages:
   - Use 'grep' or 'find' to search within 'conversations/${this.conversation_id}/messages/'.
   - Use 'read' to view specific message files.
3. **Accuracy**: Ensure the 'context' field in Shadow Context is a concise but sufficient summary of the progress and key decisions.
4. **Tool Use**: Be proactive in using tools to explore the filesystem and update your state.
`
	}
}
