import { homedir } from 'os'
import { generateText, type CoreMessage, type LanguageModel } from 'ai'
import { Polywise } from 'polywise'
import { injectable } from 'tsyringe'

import Providers from './Providers'
import Sessions from './Sessions'
import getTools from './Tools'

import type { ModelConfig } from './Providers'

export interface FstArgs {
	conversation_id: string
	session_id: string
	router_model: ModelConfig
	default_model: ModelConfig
	fallback_models?: Array<ModelConfig>
	cwd: string
}

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

		await this.sessions.init(args.conversation_id, args.session_id)

		await this.polywise.init({
			data_dir: `${homedir()}/.polywise/.fst/${args.conversation_id}/memory`
		})
	}

	public async think(user_input: string) {
		this.sessions.addHistory({ role: 'user', content: user_input })

		const target_model = await this.routeRequest(user_input)

		let is_finished = false

		while (!is_finished) {
			const context = this.sessions.getContext()
			const history = this.sessions.getHistory()
			const memory = await this.polywise.recallFromMemory({ query: user_input })
			const related_memories = memory.related_contexts.map(c => JSON.stringify(c))
			const system_prompt = this.buildSystemPrompt(context, related_memories)

			const result = await generateText({
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

			const { text, usage, finishReason } = result as {
				text: string
				usage: { promptTokens: number; completionTokens: number }
				finishReason: string
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
				return
			}

			this.sessions.addHistory({ role: 'assistant', content: text })

			if (finishReason !== 'length') {
				is_finished = true
			}

			await this.sessions.save(this.fst_config.conversation_id, this.fst_config.session_id)
		}
	}

	private async routeRequest(input: string) {
		const { text } = await generateText({
			model: this.providers.createModel(this.fst_config.router_model) as unknown as LanguageModel,
			prompt:
				`Decide which model should handle this request: "${input}". ` +
				`Available models: ${JSON.stringify(this.fst_config.fallback_models || [this.fst_config.default_model])}. ` +
				`Return only the model ID.`
		})

		const selected_id = text.trim()
		const selected = [this.fst_config.default_model, ...(this.fst_config.fallback_models || [])].find(
			m => m.id === selected_id
		)

		return selected || this.fst_config.default_model
	}

	private async summarize(content: string, model_config: ModelConfig) {
		const { text } = await generateText({
			model: this.providers.createModel(model_config) as unknown as LanguageModel,
			prompt: `Summarize the following content into key information for a structured context: \n\n${content}`
		})

		return text
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
