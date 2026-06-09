import { embed, readUIMessageStream, tool, ToolLoopAgent } from 'ai'
import { object, string } from 'zod'

import google_search_agent_prompt from '../consts/prompts/google_search_agent_prompt.md'

import type { GoogleEmbeddingModelOptions, GoogleLanguageModelOptions } from '@ai-sdk/google'
import type { ProviderOptions } from '@ai-sdk/provider-utils'
import type { LanguageModel, ToolSet } from 'ai'

type ModelType = 'text' | 'embedding' | 'rerank'

export interface EmbeddingResult {
	run: (value: string) => Promise<Array<number>>
}

export interface RerankResult {
	run: (query: string, values: Array<string>) => Promise<Array<number>>
}

export interface ModelResult {
	model: LanguageModel
	provider_options?: ProviderOptions
	tools?: ToolSet
	runtime_name?: string
}

export type GetModelResult<T extends ModelType> = T extends 'embedding'
	? EmbeddingResult
	: T extends 'rerank'
		? RerankResult
		: ModelResult

export interface GetModelArgs<T extends ModelType = 'text'> {
	provider: string
	model: string
	type?: T
	effort?: string
	options?: any
	model_tool?: boolean
}

interface FireworksRerankItem {
	index?: number
	relevance_score?: number
}

interface FireworksRerankResponse {
	data?: Array<FireworksRerankItem>
	results?: Array<FireworksRerankItem>
}

const effort_ranks = ['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'] as const

type EffortValue = (typeof effort_ranks)[number]

const getEffortRank = (value: string) => effort_ranks.indexOf(value as EffortValue)

const getReasoningEffort = (effort?: string) => {
	if (!effort || effort === 'default') return null

	return getEffortRank(effort) >= 0 ? effort : null
}

const getSupportedEffort = (effort: string | null, supported: Array<string>) => {
	if (!effort) return null
	if (supported.includes(effort)) return effort

	const target_rank = getEffortRank(effort)

	if (target_rank < 0) return null

	const candidates = supported
		.map(value => ({ value, rank: getEffortRank(value) }))
		.filter(item => item.rank >= 0)
		.sort((a, b) => {
			const distance_diff = Math.abs(a.rank - target_rank) - Math.abs(b.rank - target_rank)

			if (distance_diff !== 0) return distance_diff

			return b.rank - a.rank
		})

	return candidates[0]?.value ?? null
}

const getThinkingBudget = (effort: string | null) => {
	switch (effort) {
		case 'none':
			return 0
		case 'minimal':
		case 'low':
			return 1024
		case 'medium':
			return 4096
		case 'high':
			return 8192
		case 'xhigh':
			return 16384
		case 'max':
			return 32768
		default:
			return null
	}
}

const normalizeJinaModel = (model: string, type: ModelType) => {
	if (type === 'rerank' && model === 'jina-rerank-v3') {
		return 'jina-reranker-v3'
	}

	return model
}

const normalizeOpenResponsesUrl = (value?: string) => {
	if (!value) return value

	const normalized = value.replace(/\/+$/, '')

	if (normalized.endsWith('/responses')) {
		return normalized
	}

	if (normalized.endsWith('/v1')) {
		return `${normalized}/responses`
	}

	return `${normalized}/v1/responses`
}

const getFireworksBaseUrl = (value?: string) => {
	return (value || 'https://api.fireworks.ai/inference/v1').replace(/\/+$/, '')
}

const requireFireworksApiKey = (options?: GetModelArgs['options']) => {
	const api_key = options?.apiKey || process.env.FIREWORKS_API_KEY

	if (!api_key) {
		throw new Error('Fireworks API key is required for rerank models.')
	}

	return api_key
}

const getFireworksRequestHeaders = (args: { api_key: string; headers?: Record<string, string> }) => {
	const { api_key, headers } = args

	return {
		Authorization: `Bearer ${api_key}`,
		'Content-Type': 'application/json',
		...(headers || {})
	}
}

const toIndexedScores = (args: { values: Array<string>; items?: Array<FireworksRerankItem> }) => {
	const { values, items } = args
	const scores = values.map(() => 0)

	items?.forEach(item => {
		if (
			typeof item.index === 'number' &&
			item.index >= 0 &&
			item.index < scores.length &&
			typeof item.relevance_score === 'number'
		) {
			scores[item.index] = item.relevance_score
		}
	})

	return scores
}

const createFireworksEmbeddingResult = async (args: { model: string; options?: GetModelArgs['options'] }) => {
	const { model, options } = args
	const target_fireworks = (await import('@ai-sdk/fireworks')).createFireworks(options)
	const embedding_model = target_fireworks.embeddingModel(model)

	return {
		run: async (value: string) => {
			const { embedding } = await embed({
				model: embedding_model,
				value
			})

			return embedding
		}
	} satisfies EmbeddingResult
}

const createFireworksRerankResult = (args: { model: string; options?: GetModelArgs['options'] }) => {
	const { model, options } = args
	const api_key = requireFireworksApiKey(options)
	const base_url = getFireworksBaseUrl(options?.baseURL)
	const headers = getFireworksRequestHeaders({
		api_key,
		headers: options?.headers as Record<string, string> | undefined
	})

	return {
		run: async (query: string, values: Array<string>) => {
			if (values.length === 0) return []

			const response = await fetch(`${base_url}/rerank`, {
				method: 'POST',
				headers,
				body: JSON.stringify({
					model,
					query,
					documents: values,
					top_n: values.length,
					return_documents: false
				})
			})

			if (!response.ok) {
				throw new Error(
					`Fireworks rerank request failed (${response.status}): ${await response.text()}`
				)
			}

			const data = (await response.json()) as FireworksRerankResponse

			return toIndexedScores({
				values,
				items: data.data ?? data.results
			})
		}
	} satisfies RerankResult
}

const mergeProviderOptions = (...values: Array<ProviderOptions | undefined>) => {
	const merged = values.reduce<Record<string, unknown>>((target, current) => {
		if (!current) return target

		Object.entries(current).forEach(([key, value]) => {
			const prev = target[key]

			target[key] =
				prev && value && typeof prev === 'object' && typeof value === 'object'
					? { ...(prev as Record<string, unknown>), ...(value as Record<string, unknown>) }
					: value
		})

		return target
	}, {})

	return Object.keys(merged).length ? (merged as ProviderOptions) : undefined
}

const getEffortProviderOptions = (
	provider: string,
	model: string,
	effort: string | null
): ProviderOptions | undefined => {
	if (!effort) return undefined

	switch (provider) {
		case 'openai': {
			const reasoningEffort = getSupportedEffort(effort, [
				'none',
				'minimal',
				'low',
				'medium',
				'high',
				'xhigh'
			])

			return reasoningEffort ? ({ openai: { reasoningEffort } } as ProviderOptions) : undefined
		}
		case 'azure_openai': {
			const reasoningEffort = getSupportedEffort(effort, [
				'none',
				'minimal',
				'low',
				'medium',
				'high',
				'xhigh'
			])

			return reasoningEffort ? ({ azure: { reasoningEffort } } as ProviderOptions) : undefined
		}
		case 'open_responses': {
			const reasoningEffort = getSupportedEffort(effort, ['none', 'low', 'medium', 'high', 'xhigh'])

			return reasoningEffort ? ({ open_responses: { reasoningEffort } } as ProviderOptions) : undefined
		}
		case 'xiaomi_mimo':
		case 'open_compatible':
			return { openaiCompatible: { reasoningEffort: effort } } as ProviderOptions
		case 'codex_native': {
			const reasoningEffort = getSupportedEffort(effort, ['none', 'low', 'medium', 'high', 'xhigh'])

			return reasoningEffort ? ({ 'codex-app-server': { reasoningEffort } } as ProviderOptions) : undefined
		}
		case 'google_gemini': {
			const thinkingLevel = getSupportedEffort(effort, ['minimal', 'low', 'medium', 'high'])
			const thinkingBudget = getThinkingBudget(effort)
			const thinkingConfig = {
				includeThoughts: true,
				...(model.startsWith('gemini-3') && thinkingLevel
					? {
							thinkingLevel: thinkingLevel as NonNullable<
								GoogleLanguageModelOptions['thinkingConfig']
							>['thinkingLevel']
						}
					: {}),
				...(model.startsWith('gemini-2.5') && thinkingBudget !== null ? { thinkingBudget } : {})
			} satisfies GoogleLanguageModelOptions['thinkingConfig']

			return { google: { thinkingConfig } } as ProviderOptions
		}
		case 'anthropic': {
			const anthropicEffort = getSupportedEffort(effort, ['low', 'medium', 'high', 'xhigh', 'max'])

			return anthropicEffort ? ({ anthropic: { effort: anthropicEffort } } as ProviderOptions) : undefined
		}
		case 'deepseek':
			return {
				deepseek: {
					thinking: { type: effort === 'none' ? 'disabled' : 'enabled' }
				}
			} as ProviderOptions
		case 'moonshot': {
			const thinkingBudget = getThinkingBudget(effort)

			return {
				moonshotai: {
					thinking: {
						type: effort === 'none' ? 'disabled' : 'enabled',
						...(thinkingBudget && thinkingBudget > 0 ? { budgetTokens: thinkingBudget } : {})
					}
				}
			} as ProviderOptions
		}
		case 'mistral': {
			const reasoningEffort = getSupportedEffort(effort, ['none', 'high'])

			return reasoningEffort ? ({ mistral: { reasoningEffort } } as ProviderOptions) : undefined
		}
		case 'groq': {
			const reasoningEffort = getSupportedEffort(effort, ['none', 'default', 'low', 'medium', 'high'])

			return reasoningEffort ? ({ groq: { reasoningEffort } } as ProviderOptions) : undefined
		}
		case 'xai': {
			const reasoningEffort = getSupportedEffort(effort, ['low', 'high'])

			return reasoningEffort ? ({ xai: { reasoningEffort } } as ProviderOptions) : undefined
		}
		case 'cohere': {
			const thinkingBudget = getThinkingBudget(effort)

			return {
				cohere: {
					thinking: {
						type: effort === 'none' ? 'disabled' : 'enabled',
						...(thinkingBudget && thinkingBudget > 0 ? { tokenBudget: thinkingBudget } : {})
					}
				}
			} as ProviderOptions
		}
		case 'amazon_bedrock': {
			const maxReasoningEffort = getSupportedEffort(effort, ['low', 'medium', 'high', 'xhigh', 'max'])

			return maxReasoningEffort
				? ({ bedrock: { reasoningConfig: { maxReasoningEffort } } } as ProviderOptions)
				: undefined
		}
		case 'fireworks': {
			const thinkingBudget = getThinkingBudget(effort)

			return {
				fireworks: {
					thinking: {
						type: effort === 'none' ? 'disabled' : 'enabled',
						...(thinkingBudget && thinkingBudget > 0 ? { budgetTokens: thinkingBudget } : {})
					}
				}
			} as ProviderOptions
		}
		case 'openrouter': {
			const openrouterEffort = getSupportedEffort(effort, [
				'none',
				'minimal',
				'low',
				'medium',
				'high',
				'xhigh'
			])

			return openrouterEffort
				? ({ openrouter: { reasoning: { effort: openrouterEffort } } } as ProviderOptions)
				: undefined
		}
		default:
			return undefined
	}
}

export const getModel = async <T extends ModelType = 'text'>(args: GetModelArgs<T>): Promise<GetModelResult<T>> => {
	const { provider, type = 'text' as T, effort, options, model_tool = true } = args
	const model = provider === 'jina' ? normalizeJinaModel(args.model, type) : args.model
	const reasoning_effort = getReasoningEffort(effort)
	const effort_provider_options = getEffortProviderOptions(provider, model, reasoning_effort)

	const getResponse = async (): Promise<EmbeddingResult | RerankResult | ModelResult> => {
		switch (provider) {
			case 'xiaomi_mimo':
			case 'open_compatible':
				return {
					model: (await import('@ai-sdk/openai-compatible')).createOpenAICompatible({
						...options,
						supportsStructuredOutputs: true
					})(model),
					provider_options: effort_provider_options
				}
			case 'codex_native':
				return {
					model: (await import('../utils/codexAppServer')).createCodexNativeLanguageModel({
						model
					}),
					provider_options: effort_provider_options,
					runtime_name: 'codex_native'
				}
			case 'a2a':
				return { model: (await import('a2a-ai-provider')).a2a(model) }
			case 'open_responses':
				return {
					model: (await import('@ai-sdk/open-responses')).createOpenResponses({
						...options,
						name: 'open_responses',
						url: normalizeOpenResponsesUrl(options?.baseURL)
					})(model),
					provider_options: effort_provider_options
				}
			case 'google_gemini': {
				const { createGoogleGenerativeAI, google } = await import('@ai-sdk/google')

				const target_google = createGoogleGenerativeAI(options)

				if (type === 'embedding') {
					const embedding_model = target_google.embedding(model)

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

				const common_provider_options = mergeProviderOptions(
					{
						google: {
							thinkingConfig: { includeThoughts: true }
						} satisfies GoogleLanguageModelOptions
					},
					effort_provider_options
				)

				if (!model_tool) {
					return { model: target_model, provider_options: common_provider_options }
				}

				const search_agent = new ToolLoopAgent({
					model: target_model,
					instructions: google_search_agent_prompt,
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
			case 'jina': {
				if (type === 'embedding') {
					const target_jina = (await import('jina-ai-provider')).createJina(options)
					const embedding_model = target_jina.textEmbeddingModel(model)

					return {
						run: async (value: string) => {
							const { embeddings } = await embedding_model.doEmbed({
								values: [value],
								providerOptions: {
									jina: {
										inputType: 'text-matching'
									}
								}
							})

							return embeddings[0]
						}
					}
				}

				if (type === 'rerank') {
					const baseURL = (options?.baseURL || 'https://api.jina.ai/v1').replace(/\/$/, '')
					const apiKey = options?.apiKey || process.env.JINA_API_KEY

					if (!apiKey) {
						throw new Error('Jina API key is required for rerank models.')
					}

					return {
						run: async (query: string, values: Array<string>) => {
							if (values.length === 0) return []

							const response = await fetch(`${baseURL}/rerank`, {
								method: 'POST',
								headers: {
									Authorization: `Bearer ${apiKey}`,
									'Content-Type': 'application/json'
								},
								body: JSON.stringify({
									model,
									query,
									documents: values,
									top_n: values.length,
									return_documents: false
								})
							})

							if (!response.ok) {
								throw new Error(
									`Jina rerank request failed (${response.status}): ${await response.text()}`
								)
							}

							const data = (await response.json()) as {
								results?: Array<{ index?: number; relevance_score?: number }>
							}
							const scores = values.map(() => 0)

							data.results?.forEach(item => {
								if (
									typeof item.index === 'number' &&
									item.index >= 0 &&
									item.index < scores.length &&
									typeof item.relevance_score === 'number'
								) {
									scores[item.index] = item.relevance_score
								}
							})

							return scores
						}
					}
				}

				throw new Error('Jina provider only supports embedding and rerank models.')
			}
			case 'openai':
				return {
					model: (await import('@ai-sdk/openai')).createOpenAI(options)(model),
					provider_options: effort_provider_options
				}
			case 'anthropic':
				return {
					model: (await import('@ai-sdk/anthropic')).createAnthropic(options)(model),
					provider_options: effort_provider_options
				}
			case 'deepseek':
				return {
					model: (await import('@ai-sdk/deepseek')).createDeepSeek(options)(model),
					provider_options: effort_provider_options
				}
			case 'moonshot':
				return {
					model: (await import('@ai-sdk/moonshotai')).createMoonshotAI(options)(model),
					provider_options: effort_provider_options
				}
			case 'zhipu':
				return { model: (await import('zhipu-ai-provider')).createZhipu(options)(model) }
			case 'minimax':
				return { model: (await import('vercel-minimax-ai-provider')).createMinimax(options)(model) }
			case 'mistral':
				return {
					model: (await import('@ai-sdk/mistral')).createMistral(options)(model),
					provider_options: effort_provider_options
				}
			case 'groq':
				return {
					model: (await import('@ai-sdk/groq')).createGroq(options)(model),
					provider_options: effort_provider_options
				}
			case 'xai':
				return {
					model: (await import('@ai-sdk/xai')).createXai(options)(model),
					provider_options: effort_provider_options
				}
			case 'cohere':
				return {
					model: (await import('@ai-sdk/cohere')).createCohere(options)(model),
					provider_options: effort_provider_options
				}
			case 'perplexity':
				return { model: (await import('@ai-sdk/perplexity')).createPerplexity(options)(model) }
			case 'deepinfra':
				return { model: (await import('@ai-sdk/deepinfra')).createDeepInfra(options)(model) }
			case 'together':
				return { model: (await import('@ai-sdk/togetherai')).createTogetherAI(options)(model) }
			case 'azure_openai':
				return {
					model: (await import('@ai-sdk/azure')).createAzure(options)(model),
					provider_options: effort_provider_options
				}
			case 'amazon_bedrock':
				return {
					model: (await import('@ai-sdk/amazon-bedrock')).createAmazonBedrock(options)(model),
					provider_options: effort_provider_options
				}
			case 'cerebras':
				return { model: (await import('@ai-sdk/cerebras')).createCerebras(options)(model) }
			case 'vercel':
				return { model: (await import('@ai-sdk/vercel')).createVercel(options)(model) }
			case 'fireworks':
				if (type === 'embedding') {
					return createFireworksEmbeddingResult({
						model,
						options
					})
				}

				if (type === 'rerank') {
					return createFireworksRerankResult({
						model,
						options
					})
				}

				return {
					model: (await import('@ai-sdk/fireworks')).createFireworks(options)(model),
					provider_options: effort_provider_options
				}
			case 'ollama':
				return { model: (await import('ai-sdk-ollama')).createOllama(options)(model) }
			case 'openrouter':
				return {
					model: (await import('@openrouter/ai-sdk-provider')).createOpenRouter({
						...options,
						headers: { 'HTTP-Referer': 'https://polywise.io', 'X-Title': 'Polywise' }
					})(model),
					provider_options: effort_provider_options
				}
			default:
				throw new Error(`Unsupported provider: ${provider}`)
		}
	}

	return (await getResponse()) as GetModelResult<T>
}
