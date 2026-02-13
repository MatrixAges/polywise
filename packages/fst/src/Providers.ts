import os from 'node:os'
import path from 'node:path'
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createAzure } from '@ai-sdk/azure'
import { createCerebras } from '@ai-sdk/cerebras'
import { createCohere } from '@ai-sdk/cohere'
import { createDeepInfra } from '@ai-sdk/deepinfra'
import { createDeepSeek } from '@ai-sdk/deepseek'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createVertex } from '@ai-sdk/google-vertex'
import { createGroq } from '@ai-sdk/groq'
import { createMistral } from '@ai-sdk/mistral'
import { createOpenAI } from '@ai-sdk/openai'
import { createPerplexity } from '@ai-sdk/perplexity'
import { createTogetherAI } from '@ai-sdk/togetherai'
import { createXai } from '@ai-sdk/xai'
import to from 'await-to-js'
import fs from 'fs-extra'
import { injectable } from 'tsyringe'
import { zodToJsonSchema } from 'zod-to-json-schema'

import { AppConfigSchema } from './types'
import { config_dir_path, default_config } from './utils'

import type { AppConfig, ModelConfig } from './types'

@injectable()
export default class Providers {
	costs: Map<string, number> = new Map()
	config: AppConfig | null = null

	public async init() {
		const config_path = path.join(config_dir_path, 'config.jsonc')
		const schema_path = path.join(config_dir_path, 'schema.json')

		await fs.ensureDir(config_path)

		const json_schema = zodToJsonSchema(AppConfigSchema as any, 'AppConfig')

		await fs.writeJson(schema_path, json_schema, { spaces: 2 })

		const [_, exists] = await to(fs.pathExists(config_path))

		if (!exists) {
			await fs.writeJson(config_path, default_config, { spaces: 2 })
		}

		const [read_err, content] = await to(fs.readFile(config_path, 'utf-8'))

		if (!read_err) {
			const parsed_config = JSON.parse(content)
			const validation = AppConfigSchema.safeParse(parsed_config)

			if (validation.success) {
				this.config = validation.data
			}
		}

		if (this.config?.enable_cost) {
			await this.loadCosts()
		}
	}

	public createModel(config: ModelConfig) {
		const provider = this.getProvider(config)

		return provider(config.model)
	}

	public async trackCost(
		model_id: string,
		usage: { promptTokens: number; completionTokens: number },
		config: ModelConfig
	) {
		if (!this.config?.enable_cost || !config.price_per_token) {
			return
		}

		const cost =
			usage.promptTokens * config.price_per_token.prompt +
			usage.completionTokens * config.price_per_token.completion
		const current_cost = this.costs.get(model_id) || 0

		this.costs.set(model_id, current_cost + cost)

		await this.saveCosts()
	}

	public isOverLimit(model_id: string, max_cost?: number) {
		if (!max_cost) {
			return false
		}

		return (this.costs.get(model_id) || 0) >= max_cost
	}

	private async loadCosts() {
		const cost_path = path.join(os.homedir(), '.polywise', 'cost.json')
		const [err, exists] = await to(fs.pathExists(cost_path))

		if (!exists) return

		const [read_err, content] = await to(fs.readJson(cost_path))

		if (!read_err && content) {
			this.costs = new Map(Object.entries(content))
		}
	}

	private async saveCosts() {
		const cost_dir = path.join(os.homedir(), '.polywise')
		const cost_path = path.join(cost_dir, 'cost.json')

		await fs.ensureDir(cost_dir)

		const data = Object.fromEntries(this.costs)

		await fs.writeJson(cost_path, data, { spaces: 2 })
	}

	private getProvider(config: ModelConfig) {
		const { provider, api_key, base_url } = config

		switch (provider.toLowerCase()) {
			case 'openai':
				return createOpenAI({ apiKey: api_key, baseURL: base_url })
			case 'anthropic':
				return createAnthropic({ apiKey: api_key, baseURL: base_url })
			case 'google':
				return createGoogleGenerativeAI({ apiKey: api_key, baseURL: base_url })
			case 'deepseek':
				return createDeepSeek({ apiKey: api_key, baseURL: base_url })
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
