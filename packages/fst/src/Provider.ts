import { dirname } from 'path'
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

import { ConfigSchema } from './types'
import { default_config, getConfigPath } from './utils'

import type { Config } from './types'

@injectable()
export default class Provider {
	costs: Map<string, number> = new Map()
	config: Config | null = null

	get model() {
		if (this.config?.model) return this.config.model

		const provider_keys = Object.keys(this.config.provider)
		const provider_name = provider_keys[0]
		const provider = this.config.provider[provider_name]
		const model_keys = Object.keys(provider.models)

		return `${provider_name}/${model_keys[0]}`
	}

	public async init() {
		const config_path = getConfigPath('/config.jsonc')

		const [_, exists] = await to(fs.pathExists(config_path))

		if (!exists) {
			await fs.writeJson(config_path, default_config, { spaces: 6 })
		}

		const [read_err, content] = await to(fs.readFile(config_path, 'utf-8'))

		if (!read_err) {
			const parsed_config = JSON.parse(content)
			const validation = ConfigSchema.safeParse(parsed_config)

			if (validation.success) {
				this.config = validation.data
			}
		}
	}

	public getLanguageModel(v?: string) {
		const [provider, model] = (v || this.model).split('/')

		return this.getProvider(provider)(model)
	}

	private getProvider(v: string) {
		const provider = this.config?.provider?.[v]
		const options = provider?.options || {}

		switch (v) {
			case 'openai':
				return createOpenAI(options)
			case 'anthropic':
				return createAnthropic(options)
			case 'google':
				return createGoogleGenerativeAI(options)
			case 'deepseek':
				return createDeepSeek(options)
			case 'mistral':
				return createMistral(options)
			case 'groq':
				return createGroq(options)
			case 'xai':
				return createXai(options)
			case 'cohere':
				return createCohere(options)
			case 'perplexity':
				return createPerplexity(options)
			case 'deepinfra':
				return createDeepInfra(options)
			case 'togetherai':
				return createTogetherAI(options)
			case 'azure':
				return createAzure(options)
			case 'amazon-bedrock':
				return createAmazonBedrock(options)
			case 'google-vertex':
				return createVertex(options)
			case 'cerebras':
				return createCerebras(options)
			default:
				throw new Error(`Unsupported provider: ${provider}`)
		}
	}
}
