import { embed, readUIMessageStream, tool, ToolLoopAgent } from 'ai'
import { object, string } from 'zod'

import type { GoogleEmbeddingModelOptions, GoogleLanguageModelOptions } from '@ai-sdk/google'
import type { ProviderOptions } from '@ai-sdk/provider-utils'
import type { LanguageModel, ToolSet } from 'ai'

type ModelType = 'text' | 'embedding' | 'rerank'

export interface EmbeddingResult {
	run: (value: string) => Promise<Array<number>>
}

export interface ModelResult {
	model: LanguageModel
	provider_options?: ProviderOptions
	tools?: ToolSet
}

export type GetModelResult<T extends ModelType> = T extends 'embedding' | 'rerank' ? EmbeddingResult : ModelResult

export interface GetModelArgs<T extends ModelType = 'text'> {
	provider: string
	model: string
	type?: T
	options?: any
	model_tool?: boolean
}

export const getModel = async <T extends ModelType = 'text'>(args: GetModelArgs<T>): Promise<GetModelResult<T>> => {
	const { provider, model, type = 'text' as T, options, model_tool = true } = args

	const getResponse = async (): Promise<EmbeddingResult | ModelResult> => {
		switch (provider) {
			case 'xiaomi_mimo':
			case 'open_compatible':
				return {
					model: (await import('@ai-sdk/openai-compatible')).createOpenAICompatible(options)(model)
				}
			case 'a2a':
				return { model: (await import('a2a-ai-provider')).a2a(model) }
			case 'acp':
				return {
					model: (await import('@mcpc-tech/acp-ai-provider'))
						.createACPProvider(options)
						.languageModel()
				}
			case 'open_responses':
				return {
					model: (await import('@ai-sdk/open-responses')).createOpenResponses({
						...options,
						url: options.baseURL as string
					})(model)
				}
			case 'google_gemini': {
				const { createGoogleGenerativeAI, google } = await import('@ai-sdk/google')

				const target_google = createGoogleGenerativeAI(options)

				if (type === 'embedding') {
					const embedding_model = target_google.embedding(model)

					// target_google.rerankingModel!('')

					return {
						run: async (value: string) => {
							const { embedding } = await embed({
								model: embedding_model,
								value,
								providerOptions: {
									google: {
										outputDimensionality: 1024,
										taskType: 'SEMANTIC_SIMILARITY'
									} satisfies GoogleEmbeddingModelOptions
								}
							})
							return embedding
						}
					}
				}

				const target_model = target_google(model)

				const common_provider_options = {
					google: { thinkingConfig: { includeThoughts: true } } satisfies GoogleLanguageModelOptions
				}

				if (!model_tool) {
					return { model: target_model, provider_options: common_provider_options }
				}

				const search_agent = new ToolLoopAgent({
					model: target_model,
					instructions: `You are a google search agent.`,
					tools: { googleSearch: google.tools.googleSearch({}) }
				})

				const google_search_tool = tool({
					description: 'Search using google search for user query if possible.',
					inputSchema: object({ query: string().describe('The search content') }),
					execute: async function* ({ query }, { abortSignal }) {
						const stream_result = await search_agent.stream({ prompt: query, abortSignal })
						for await (const message of readUIMessageStream({
							stream: stream_result.toUIMessageStream()
						})) {
							yield message
						}
					}
				})

				return {
					model: target_model,
					provider_options: common_provider_options,
					tools: { google_search_tool }
				}
			}
			case 'openai':
				return { model: (await import('@ai-sdk/openai')).createOpenAI(options)(model) }
			case 'anthropic':
				return { model: (await import('@ai-sdk/anthropic')).createAnthropic(options)(model) }
			case 'deepseek':
				return { model: (await import('@ai-sdk/deepseek')).createDeepSeek(options)(model) }
			case 'moonshot':
				return { model: (await import('@ai-sdk/moonshotai')).createMoonshotAI(options)(model) }
			case 'zhipu':
				return { model: (await import('zhipu-ai-provider')).createZhipu(options)(model) }
			case 'minimax':
				return { model: (await import('vercel-minimax-ai-provider')).createMinimax(options)(model) }
			case 'mistral':
				return { model: (await import('@ai-sdk/mistral')).createMistral(options)(model) }
			case 'groq':
				return { model: (await import('@ai-sdk/groq')).createGroq(options)(model) }
			case 'xai':
				return { model: (await import('@ai-sdk/xai')).createXai(options)(model) }
			case 'cohere':
				return { model: (await import('@ai-sdk/cohere')).createCohere(options)(model) }
			case 'perplexity':
				return { model: (await import('@ai-sdk/perplexity')).createPerplexity(options)(model) }
			case 'deepinfra':
				return { model: (await import('@ai-sdk/deepinfra')).createDeepInfra(options)(model) }
			case 'together':
				return { model: (await import('@ai-sdk/togetherai')).createTogetherAI(options)(model) }
			case 'azure_openai':
				return { model: (await import('@ai-sdk/azure')).createAzure(options)(model) }
			case 'amazon_bedrock':
				return { model: (await import('@ai-sdk/amazon-bedrock')).createAmazonBedrock(options)(model) }
			case 'cerebras':
				return { model: (await import('@ai-sdk/cerebras')).createCerebras(options)(model) }
			case 'vercel':
				return { model: (await import('@ai-sdk/vercel')).createVercel(options)(model) }
			case 'fireworks':
				return { model: (await import('@ai-sdk/fireworks')).createFireworks(options)(model) }
			case 'ollama':
				return { model: (await import('ai-sdk-ollama')).createOllama(options)(model) }
			case 'openrouter':
				return {
					model: (await import('@openrouter/ai-sdk-provider')).createOpenRouter({
						...options,
						headers: { 'HTTP-Referer': 'https://polywise.io', 'X-Title': 'Polywise' }
					})(model)
				}
			default:
				throw new Error(`Unsupported provider: ${provider}`)
		}
	}

	return (await getResponse()) as GetModelResult<T>
}
