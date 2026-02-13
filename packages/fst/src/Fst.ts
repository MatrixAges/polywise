import { generateText, streamText } from 'ai'
import to from 'await-to-js'
import fs from 'fs-extra'
import { Polywise } from 'polywise'
import { injectable } from 'tsyringe'

import Providers from './Providers'
import Sessions from './Sessions'
import getTools from './Tools'
import { getPath } from './utils'

import type { CoreMessage, LanguageModel } from 'ai'
import type { FstArgs, ModelConfig } from './types'

@injectable()
export default class Fst {
	private fst_config: FstArgs

	constructor(
		private providers: Providers,
		private sessions: Sessions,
		private polywise: Polywise
	) {}

	public async init(args: FstArgs) {
		this.fst_config = args

		const data_dir = getPath(`/${args.conversation_id}/:memory:`)

		await fs.ensureDir(data_dir)
		await to(this.providers.init())
		await to(this.sessions.init(args.conversation_id, args.session_id))

		await to(
			this.polywise.init({
				data_dir,
				metrics_ids: [args.conversation_id]
			})
		)
	}

	public async think(user_input: string) {
		this.sessions.addHistory({ role: 'user', content: user_input })

		const [route_err, target_model] = await to(this.routeRequest(user_input))

		if (route_err || !target_model) {
			return
		}

		let is_finished = false
		let last_text = ''

		while (!is_finished) {
			const context = this.sessions.getContext()
			const history = this.sessions.getHistory()
			const [recall_err, memory] = await to(
				this.polywise.recallFromMemory({
					query: user_input,
					metrics_ids: [this.fst_config.conversation_id]
				})
			)

			const related_memories = recall_err ? [] : memory.related_contexts.map(c => JSON.stringify(c))
			const system_prompt = this.buildSystemPrompt(context, related_memories)

			const [gen_err, result] = await to(
				generateText({
					model: this.providers.createModel(target_model) as unknown as LanguageModel,
					system: system_prompt,
					messages: history as Array<CoreMessage>,
					tools: getTools({
						cwd: this.fst_config.cwd,
						sessions: this.sessions,
						summarize: content => this.summarize(content, target_model)
					}),
					maxSteps: 10
				} as any)
			)

			if (gen_err || !result) {
				if (gen_err) {
					console.error('FST Think Error:', gen_err)
				}
				break
			}

			const { text, usage, finishReason, response } = result as {
				text: string
				usage: { promptTokens: number; completionTokens: number }
				finishReason: string
				response: { messages: Array<CoreMessage> }
			}

			this.providers.trackCost(
				target_model.id,
				{
					promptTokens: usage.promptTokens,
					completionTokens: usage.completionTokens
				},
				target_model
			)

			if (this.providers.isOverLimit(target_model.id, target_model.max_cost)) {
				break
			}

			if (response?.messages && response.messages.length > 0) {
				for (const msg of response.messages) {
					this.sessions.addHistory(msg)
				}
			} else {
				this.sessions.addHistory({ role: 'assistant', content: text })
			}

			if (!text && response?.messages?.length > 0) {
				// If no text but we have history (likely tool calls), return a placeholder or the last tool result?
				// But we return 'string'.
				// Let's verify if the last message has content.
				const lastMsg = response.messages[response.messages.length - 1]
				if (lastMsg.role === 'tool') {
					// The last thing was a tool result.
					// If the model didn't say anything after, we can say "Action completed."
					text = '[Action completed]'
				}
			}

			last_text = text

			await to(
				this.polywise.save({
					content: text,
					metrics_ids: [this.fst_config.conversation_id]
				})
			)

			if (finishReason !== 'length') {
				is_finished = true
			}

			await to(this.sessions.save(this.fst_config.conversation_id, this.fst_config.session_id))
		}

		return last_text
	}

	public async streamThink(user_input: string) {
		this.sessions.addHistory({ role: 'user', content: user_input })

		const [route_err, target_model] = await to(this.routeRequest(user_input))

		if (route_err || !target_model) {
			return
		}

		const context = this.sessions.getContext()
		const history = this.sessions.getHistory()
		const [recall_err, memory] = await to(
			this.polywise.recallFromMemory({
				query: user_input,
				metrics_ids: [this.fst_config.conversation_id]
			})
		)

		const related_memories = recall_err ? [] : memory.related_contexts.map(c => JSON.stringify(c))
		const system_prompt = this.buildSystemPrompt(context, related_memories)

		return streamText({
			model: this.providers.createModel(target_model) as unknown as LanguageModel,
			system: system_prompt,
			messages: history as Array<CoreMessage>,
			tools: getTools({
				cwd: this.fst_config.cwd,
				sessions: this.sessions,
				summarize: content => this.summarize(content, target_model)
			}),
			maxSteps: 10,
			onFinish: async result => {
				this.providers.trackCost(
					target_model.id,
					{
						promptTokens: result.usage.promptTokens,
						completionTokens: result.usage.completionTokens
					},
					target_model
				)

				if (result.response?.messages && result.response.messages.length > 0) {
					for (const msg of result.response.messages) {
						this.sessions.addHistory(msg)
					}
				} else {
					this.sessions.addHistory({ role: 'assistant', content: result.text })
				}

				await to(
					this.polywise.save({
						content: result.text,
						metrics_ids: [this.fst_config.conversation_id]
					})
				)

				await to(this.sessions.save(this.fst_config.conversation_id, this.fst_config.session_id))
			}
		} as any)
	}

	private async routeRequest(input: string) {
		const [err, result] = await to(
			generateText({
				model: this.providers.createModel(this.fst_config.router_model) as unknown as LanguageModel,
				prompt:
					`Decide which model should handle this request: "${input}". ` +
					`Available models: ${JSON.stringify(this.fst_config.fallback_models || [this.fst_config.default_model])}. ` +
					`Return only the model ID.`
			})
		)

		if (err || !result) {
			return this.fst_config.default_model
		}

		const selected_id = result.text.trim()
		const selected = [this.fst_config.default_model, ...(this.fst_config.fallback_models || [])].find(
			m => m.id === selected_id
		)

		return selected || this.fst_config.default_model
	}

	private async summarize(content: string, model_config: ModelConfig) {
		const [err, result] = await to(
			generateText({
				model: this.providers.createModel(model_config) as unknown as LanguageModel,
				prompt: `Summarize the following content into key information for a structured context: \n\n${content}`
			})
		)

		if (err || !result) {
			return ''
		}

		return result.text
	}

	private buildSystemPrompt(context: Record<string, unknown>, memories: Array<string>) {
		return `You are a Full Self Thinking (FST) Agent.
		Current Context (Finite State): ${JSON.stringify(context)}
		Related Memories: ${memories.join('\n')}
		
		Goal: Self-execute, persist in thinking, and maintain accurate context.
		Use tools when necessary. Always update the structured context when significant information is gained.
		You can use 'load_reference' to read a file and summarize it into your context.
		You can use 'update_context' to manually update your structured state.
		You can use 'undo'/'redo' to manage context state changes.`
	}
}
