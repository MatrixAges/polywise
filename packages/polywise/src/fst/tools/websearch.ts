import { config } from '@core/config'
import { tool } from 'ai'
import TurndownService from 'turndown'
import { number, object, string } from 'zod'

const turndown = new TurndownService({
	headingStyle: 'atx',
	hr: '---',
	bulletListMarker: '-',
	codeBlockStyle: 'fenced',
	emDelimiter: '*'
})

turndown.remove(['script', 'style', 'meta', 'link', 'noscript'])

const MAX_CHARS = 30000

const inputSchema = object({
	query: string().describe('Keywords used to search the web for a list of relevant links'),
	max_chars: number().optional().describe('Max characters to return (default 30000)')
})

export const createWebSearchTool = () => {
	return tool({
		description:
			'Search the web using DuckDuckGo and return a link-discovery result. This tool is for finding candidate URLs only, not for final factual answers. After reviewing the returned links and snippets, call web_fetch_tool on the most relevant target URL to read the webpage body.',
		inputSchema,
		execute: async input => {
			const max_chars = input.max_chars ?? MAX_CHARS
			const jina_api_key = config.jina_api_key?.trim()
			const diagnostics: {
				jina_status?: number
				jina_error?: string
				direct_status?: number
				direct_error?: string
			} = {}

			if (jina_api_key) {
				try {
					const url = `https://s.jina.ai/?q=${encodeURIComponent(input.query)}`
					const resp = await fetch(url, {
						signal: AbortSignal.timeout(15000),
						headers: {
							Accept: 'text/plain',
							Authorization: `Bearer ${jina_api_key}`
						}
					})

					diagnostics.jina_status = resp.status

					if (!resp.ok) throw new Error(`Jina returned HTTP ${resp.status}`)

					const markdown = await resp.text()

					if (!markdown.trim()) throw new Error('Jina returned empty content')

					return {
						query: input.query,
						source: 'jina' as const,
						result_type: 'link_list_only',
						next_action: 'call_web_fetch_tool',
						warning: 'Do not treat search result snippets as final evidence. Fetch the target page body with web_fetch_tool before answering.',
						content: markdown.slice(0, max_chars),
						truncated: markdown.length > max_chars,
						...diagnostics
					}
				} catch (e: unknown) {
					diagnostics.jina_error = e instanceof Error ? e.message : 'Unknown error'
				}
			}

			try {
				const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(input.query)}`
				const resp = await fetch(url, {
					signal: AbortSignal.timeout(15000),
					headers: {
						Accept: 'text/html,application/xhtml+xml,*/*'
					}
				})

				diagnostics.direct_status = resp.status

				if (!resp.ok) throw new Error(`DuckDuckGo returned HTTP ${resp.status}`)

				const html = await resp.text()
				const markdown = turndown.turndown(html)

				return {
					query: input.query,
					source: 'direct' as const,
					result_type: 'link_list_only',
					next_action: 'call_web_fetch_tool',
					warning: 'Do not treat search result snippets as final evidence. Fetch the target page body with web_fetch_tool before answering.',
					content: markdown.slice(0, max_chars),
					truncated: markdown.length > max_chars,
					...diagnostics
				}
			} catch (e: unknown) {
				diagnostics.direct_error = e instanceof Error ? e.message : 'Unknown error'

				return {
					query: input.query,
					source: 'failed' as const,
					result_type: 'link_list_only',
					next_action: 'retry_or_refine_search',
					warning: 'Search failed before any target page could be fetched.',
					content: '',
					truncated: false,
					error: diagnostics.direct_error,
					...diagnostics
				}
			}
		}
	})
}
