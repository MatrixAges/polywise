import { createAlibaba } from '@ai-sdk/alibaba'
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
import { createHuggingFace } from '@ai-sdk/huggingface'
import { createMistral } from '@ai-sdk/mistral'
import { createMoonshotAI } from '@ai-sdk/moonshotai'
import { createOpenResponses } from '@ai-sdk/open-responses'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { createPerplexity } from '@ai-sdk/perplexity'
import { createTogetherAI } from '@ai-sdk/togetherai'
import { createVercel } from '@ai-sdk/vercel'
import { createXai } from '@ai-sdk/xai'
import { createACPProvider } from '@mcpc-tech/acp-ai-provider'
import { a2a } from 'a2a-ai-provider'
import { createMinimax } from 'vercel-minimax-ai-provider'
import { createZhipu } from 'zhipu-ai-provider'

import type { LanguageModel } from 'ai'

export const getModel = (provider: string, model: string, options: any): LanguageModel => {
	switch (provider) {
		case 'a2a':
			return a2a(model)
		case 'acp':
			return createACPProvider(options).languageModel()
		case 'open-responses':
			return createOpenResponses(options)(model)
		case 'open-compatible':
			return createOpenAICompatible(options)(model)
		case 'openai':
			return createOpenAI(options)(model)
		case 'anthropic':
			return createAnthropic(options)(model)
		case 'google':
			return createGoogleGenerativeAI(options)(model)
		case 'deepseek':
			return createDeepSeek(options)(model)
		case 'moonshotai':
			return createMoonshotAI(options)(model)
		case 'zhipu':
			return createZhipu(options)(model)
		case 'minimax':
			return createMinimax(options)(model)
		case 'mistral':
			return createMistral(options)(model)
		case 'groq':
			return createGroq(options)(model)
		case 'xai':
			return createXai(options)(model)
		case 'cohere':
			return createCohere(options)(model)
		case 'perplexity':
			return createPerplexity(options)(model)
		case 'deepinfra':
			return createDeepInfra(options)(model)
		case 'togetherai':
			return createTogetherAI(options)(model)
		case 'azure':
			return createAzure(options)(model)
		case 'amazon-bedrock':
			return createAmazonBedrock(options)(model)
		case 'google-vertex':
			return createVertex(options)(model)
		case 'cerebras':
			return createCerebras(options)(model)
		case 'vercel':
			return createVercel(options)(model)
		case 'alibaba':
			return createAlibaba(options)(model)
		case 'huggingface':
			return createHuggingFace(options)(model)
		default:
			throw new Error(`Unsupported provider: ${provider}`)
	}
}
