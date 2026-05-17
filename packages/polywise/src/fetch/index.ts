import { config } from '@core/config'
import { default_fetch_fallback_chain } from '@core/types'

import fetchWithAgentBrowser from './agentBrowser'
import fetchWithCrawl4ai from './crawl4ai'
import fetchDirect from './direct'
import fetchWithDokobot from './dokobot'
import fetchWithOpencli from './opencli'
import fetchWithRJina from './rjina'
import { extractTitleFromContent, getErrorMessage } from './runtime'

import type { WebfetchFallbackProvider } from '@core/types'
import type { FetchAttempt, FetchProviderHandler, FetchProviderResult, FetchResult, FetchSource } from './types'

const provider_handlers: Record<WebfetchFallbackProvider, FetchProviderHandler> = {
	'agent-browser': fetchWithAgentBrowser,
	opencli: fetchWithOpencli,
	crawl4ai: fetchWithCrawl4ai,
	dokobot: fetchWithDokobot,
	'r.jina.ai': fetchWithRJina
}

const supported_provider_set = new Set<WebfetchFallbackProvider>(default_fetch_fallback_chain)

const isProvider = (value: string): value is WebfetchFallbackProvider => {
	return supported_provider_set.has(value as WebfetchFallbackProvider)
}

const normalizeChain = (chain?: Array<string>) => {
	const normalized_chain = (chain ?? default_fetch_fallback_chain).filter(isProvider)

	return normalized_chain.length ? normalized_chain : [...default_fetch_fallback_chain]
}

const fail = (source: FetchSource, attempts: Array<FetchAttempt>, error: string): FetchResult => {
	return {
		ok: false,
		source,
		error,
		attempts
	}
}

const runProvider = async (
	provider: WebfetchFallbackProvider,
	url: string,
	max_chars: number
): Promise<FetchProviderResult> => {
	const result = await provider_handlers[provider]({ url, max_chars })
	const title = result.title?.trim() || extractTitleFromContent(result.content)

	return {
		...result,
		...(title ? { title } : {})
	}
}

export const fetchWithProvider = async (
	provider: WebfetchFallbackProvider,
	url: string,
	max_chars: number
): Promise<FetchProviderResult> => {
	return await runProvider(provider, url, max_chars)
}

const runChain = async (
	providers: Array<WebfetchFallbackProvider>,
	url: string,
	max_chars: number
): Promise<FetchResult> => {
	const attempts = [] as Array<FetchAttempt>

	for await (const provider of providers) {
		try {
			const result = await runProvider(provider, url, max_chars)

			return {
				...result,
				attempts
			}
		} catch (error) {
			attempts.push({
				source: provider,
				error: getErrorMessage(error)
			})
		}
	}

	const last_attempt = attempts.at(-1)

	return fail(
		last_attempt?.source ?? providers.at(-1) ?? 'r.jina.ai',
		attempts,
		last_attempt?.error ?? 'All fetch providers failed'
	)
}

export const fetchWithFallbackChain = async (url: string, max_chars: number) => {
	return await runChain(normalizeChain(config.fetch_fallback_chain), url, max_chars)
}

export const fetchWithLegacyFallback = async (url: string, max_chars: number) => {
	const attempts = [] as Array<FetchAttempt>

	try {
		const result = await fetchWithRJina({ url, max_chars })

		return {
			...result,
			attempts
		}
	} catch (error) {
		attempts.push({
			source: 'r.jina.ai',
			error: getErrorMessage(error)
		})
	}

	try {
		const result = await fetchDirect({ url, max_chars })

		return {
			...result,
			attempts
		}
	} catch (error) {
		attempts.push({
			source: 'direct',
			error: getErrorMessage(error)
		})
	}

	const last_attempt = attempts.at(-1)

	return fail(last_attempt?.source ?? 'direct', attempts, last_attempt?.error ?? 'Legacy fetch failed')
}
