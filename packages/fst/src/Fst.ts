import { generateText } from 'ai'
import to from 'await-to-js'
import fs from 'fs-extra'
// import { Polywise } from 'polywise'
import { container } from 'tsyringe'

import Provider from './Provider'
import Session from './Session'
import getTools from './Tools'
import { getId, getPath } from './utils'

import type { CoreMessage, LanguageModel } from 'ai'

export default class Fst {
	private provider = container.resolve(Provider)
	private session = container.resolve(Session)
	// private polywise = container.resolve(Polywise)

	conversation_id = getId()
	session_id = getId()

	public async init() {
		// const data_dir = getPath(`/${this.conversation_id}/:memory:`)

		await this.provider.init()
		await this.session.init(this.conversation_id, this.session_id)

		// await to(
		// 	this.polywise.init({
		// 		data_dir,
		// 		metrics_ids: [this.conversation_id]
		// 	})
		// )
	}

	public async think(user_input: string) {
		this.session.addHistory({ role: 'user', content: user_input })

		let is_finished = false
		let result = ''

		while (!is_finished) {
			const context = this.session.getContext()
			const history = this.session.getHistory()

			// const [recall_err, memory] = await to(
			// 	this.polywise.recallFromMemory({
			// 		query: user_input,
			// 		metrics_ids: [this.conversation_id]
			// 	})
			// )

			// const related_memories = recall_err ? [] : memory.related_contexts.map(c => JSON.stringify(c))
			// const system_prompt = this.buildSystemPrompt(context, related_memories)

			console.log(123)
			console.log(this.provider.getLanguageModel())

			const [err, res] = await to(
				generateText({
					model: this.provider.getLanguageModel() as unknown as LanguageModel,
					system: this.getSystemPrompt(context),
					messages: history as Array<CoreMessage>,
					tools: getTools({
						cwd: process.cwd(),
						sessions: this.session,
						summarize: content => this.summarize(content)
					}),
					maxSteps: 10
				})
			)

			if (err || !res) {
				break
			}

			const { text, finishReason } = res

			this.session.addHistory({ role: 'assistant', content: text })

			// await to(
			// 	this.polywise.save({
			// 		content: text,
			// 		metrics_ids: [this.conversation_id]
			// 	})
			// )

			if (finishReason !== 'length') {
				is_finished = true
			}

			await to(this.session.save(this.conversation_id, this.session_id))

			result = text
		}

		return result
	}

	private async summarize(content: string) {
		const [err, result] = await to(
			generateText({
				model: this.provider.getLanguageModel() as unknown as LanguageModel,
				prompt: `Summarize the following content into key information for a structured context: \n\n${content}`
			})
		)

		if (err || !result) return ''

		return result.text
	}

	private getSystemPrompt(context: Record<string, unknown>, memories?: Array<string>) {
		return `You are a Full Self Thinking (FST) Agent.
		Current Context (Finite State): ${JSON.stringify(context)}
		 ${memories ? 'Related Memories:' + memories.join('\n') : ''}
		
		Goal: Self-execute, persist in thinking, and maintain accurate context.
		Use tools when necessary. Always update the structured context when significant information is gained.
		You can use 'load_reference' to read a file and summarize it into your context.
		You can use 'update_context' to manually update your structured state.
		You can use 'undo'/'redo' to manage context state changes.`
	}
}
