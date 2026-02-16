import { generateText, Output, stepCountIs, streamText } from 'ai'
import to from 'await-to-js'
import { container } from 'tsyringe'

import { summarize, system_prompt } from './consts'
import Provider from './Provider'
import Session from './Session'
import getTools from './Tools'
import { getId } from './utils'

import type { LanguageModel, ModelMessage, StreamTextResult, Tool } from 'ai'
import type { Tools } from './Tools'
import type { ShadowContext } from './types'

export default class Fst {
	private provider = container.resolve(Provider)
	private session = container.resolve(Session)

	conversation_id = getId()

	async init() {
		this.provider.init()

		const [err] = await to(this.session.init(this.conversation_id))

		if (err) console.error('[FST] Init error:', err)
	}

	async think(user_input: string): Promise<StreamTextResult<Tools, ReturnType<typeof Output.text>>> {
		const msg_id = getId()

		await this.session.addMessage({
			id: msg_id,
			role: 'user',
			content: user_input
		})

		const shadow = this.session.getShadowContext()
		const history = await this.session.getLastMessages(6)

		const tools = getTools({
			cwd: process.cwd(),
			sessions: this.session,
			summarize: content => this.summarize(content)
		})

		const messages = history?.length > 0 ? history : [{ role: 'user', content: user_input }]

		return streamText({
			model: this.provider.getLanguageModel(),
			system: this.getSystemPrompt(shadow),
			messages: messages as Array<ModelMessage>,
			tools,
			stopWhen: stepCountIs(5),
			onFinish: async ({ text }) => {
				await this.session.addMessage({
					id: getId(),
					role: 'assistant',
					content: text
				})
			}
		})
	}

	private async summarize(content: string) {
		const [err, result] = await to(
			generateText({
				model: this.provider.getLanguageModel() as LanguageModel,
				prompt: summarize(content)
			})
		)

		if (err || !result) return content.substring(0, 100) + '...'

		return result.text
	}

	private getSystemPrompt(context: ShadowContext) {
		return system_prompt({ shadow_context: context, conversation_id: this.conversation_id })
	}
}
