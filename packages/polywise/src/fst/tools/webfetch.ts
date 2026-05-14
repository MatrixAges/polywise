import { config } from '@core/config'
import { fetchWithFallbackChain, fetchWithLegacyFallback } from '@core/fetch'
import { tool } from 'ai'
import { number, object, url } from 'zod'

const MAX_CHARS = 50000

const inputSchema = object({
	url: url().describe('The URL to fetch content from'),
	max_chars: number().optional().describe('Max characters to return (default 50000)')
})

export const createWebFetchTool = () => {
	return tool({
		description:
			'Fetch content from a URL and return it as clean Markdown. Use for reading web pages, documentation, or any online content.',
		inputSchema,
		execute: async input => {
			const max_chars = input.max_chars ?? MAX_CHARS

			return config.enbale_webfetch_chain
				? await fetchWithFallbackChain(input.url, max_chars)
				: await fetchWithLegacyFallback(input.url, max_chars)
		}
	})
}
