import type { LanguageModel } from 'ai'

export const getModel = async (provider: string, model: string, options?: any): Promise<LanguageModel> => {
	switch (provider) {
		case 'a2a':
			return (await import('a2a-ai-provider')).a2a(model)
		case 'acp':
			return (await import('@mcpc-tech/acp-ai-provider')).createACPProvider(options).languageModel()
		case 'open-responses':
			return (await import('@ai-sdk/open-responses')).createOpenResponses(options)(model)
		case 'open-compatible':
			return (await import('@ai-sdk/openai-compatible')).createOpenAICompatible(options)(model)
		case 'openai':
			return (await import('@ai-sdk/openai')).createOpenAI(options)(model)
		case 'anthropic':
			return (await import('@ai-sdk/anthropic')).createAnthropic(options)(model)
		case 'google_gemini':
			return (await import('@ai-sdk/google')).createGoogleGenerativeAI(options)(model)
		case 'deepseek':
			return (await import('@ai-sdk/deepseek')).createDeepSeek(options)(model)
		case 'moonshot':
			return (await import('@ai-sdk/moonshotai')).createMoonshotAI(options)(model)
		case 'zhipu':
			return (await import('zhipu-ai-provider')).createZhipu(options)(model)
		case 'minimax':
			return (await import('vercel-minimax-ai-provider')).createMinimax(options)(model)
		case 'mistral':
			return (await import('@ai-sdk/mistral')).createMistral(options)(model)
		case 'groq':
			return (await import('@ai-sdk/groq')).createGroq(options)(model)
		case 'xai':
			return (await import('@ai-sdk/xai')).createXai(options)(model)
		case 'cohere':
			return (await import('@ai-sdk/cohere')).createCohere(options)(model)
		case 'perplexity':
			return (await import('@ai-sdk/perplexity')).createPerplexity(options)(model)
		case 'deepinfra':
			return (await import('@ai-sdk/deepinfra')).createDeepInfra(options)(model)
		case 'together':
			return (await import('@ai-sdk/togetherai')).createTogetherAI(options)(model)
		case 'azure_openai':
			return (await import('@ai-sdk/azure')).createAzure(options)(model)
		case 'amazon_bedrock':
			return (await import('@ai-sdk/amazon-bedrock')).createAmazonBedrock(options)(model)
		case 'cerebras':
			return (await import('@ai-sdk/cerebras')).createCerebras(options)(model)
		case 'vercel':
			return (await import('@ai-sdk/vercel')).createVercel(options)(model)
		case 'alibaba':
			return (await import('@ai-sdk/alibaba')).createAlibaba(options)(model)
		case 'huggingface':
			return (await import('@ai-sdk/huggingface')).createHuggingFace(options)(model)
		default:
			throw new Error(`Unsupported provider: ${provider}`)
	}
}
