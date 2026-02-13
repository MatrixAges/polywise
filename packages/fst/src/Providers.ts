import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createAzure } from '@ai-sdk/azure'
import { createCerebras } from '@ai-sdk/cerebras'
import { createCohere } from '@ai-sdk/cohere'
import { createDeepInfra } from '@ai-sdk/deepinfra'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createVertex } from '@ai-sdk/google-vertex'
import { createGroq } from '@ai-sdk/groq'
import { createMistral } from '@ai-sdk/mistral'
import { createOpenAI } from '@ai-sdk/openai'
import { createPerplexity } from '@ai-sdk/perplexity'
import { createTogetherAI } from '@ai-sdk/togetherai'
import { createXai } from '@ai-sdk/xai'
import { injectable } from 'tsyringe'

export interface ModelConfig {
	id: string
	provider: string
	model: string
	api_key?: string
	base_url?: string
	max_cost?: number
	price_per_token?: {
		prompt: number
		completion: number
	}
}

@injectable()
export default class Providers {
	private costs: Map<string, number> = new Map()

	public createModel(config: ModelConfig) {
		const provider = this.getProvider(config)

		return provider(config.model)
	}

	public trackCost(
		model_id: string,
		usage: { promptTokens: number; completionTokens: number },
		config: ModelConfig
	) {
		if (!config.price_per_token) {
			return
		}

		const cost =
			usage.promptTokens * config.price_per_token.prompt +
			usage.completionTokens * config.price_per_token.completion
		const current_cost = this.costs.get(model_id) || 0

		this.costs.set(model_id, current_cost + cost)
	}

	public isOverLimit(model_id: string, max_cost?: number) {
		if (!max_cost) {
			return false
		}

		return (this.costs.get(model_id) || 0) >= max_cost
	}

	private getProvider(config: ModelConfig) {
		const { provider, api_key, base_url } = config

		switch (provider) {
			case 'openai':
				return createOpenAI({ apiKey: api_key, baseURL: base_url })
			case 'anthropic':
				return createAnthropic({ apiKey: api_key, baseURL: base_url })
			case 'google':
				return createGoogleGenerativeAI({ apiKey: api_key, baseURL: base_url })
			case 'mistral':
				return createMistral({ apiKey: api_key, baseURL: base_url })
			case 'groq':
				return createGroq({ apiKey: api_key, baseURL: base_url })
			case 'xai':
				return createXai({ apiKey: api_key, baseURL: base_url })
			case 'cohere':
				return createCohere({ apiKey: api_key, baseURL: base_url })
			case 'perplexity':
				return createPerplexity({ apiKey: api_key, baseURL: base_url })
			case 'deepinfra':
				return createDeepInfra({ apiKey: api_key, baseURL: base_url })
			case 'togetherai':
				return createTogetherAI({ apiKey: api_key, baseURL: base_url })
			case 'azure':
				return createAzure({ apiKey: api_key, baseURL: base_url })
			case 'amazon-bedrock':
				return createAmazonBedrock({
					accessKeyId: process.env.AWS_ACCESS_KEY_ID,
					secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
					region: process.env.AWS_REGION
				})
			case 'google-vertex':
				return createVertex({
					project: process.env.GOOGLE_VERTEX_PROJECT,
					location: process.env.GOOGLE_VERTEX_LOCATION
				})
			case 'cerebras':
				return createCerebras({ apiKey: api_key })
			default:
				throw new Error(`Unsupported provider: ${provider}`)
		}
	}
}
