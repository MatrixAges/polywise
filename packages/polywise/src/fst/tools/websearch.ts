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
			'Search the web and return link list. This tool is for finding candidate URLs only, not for final factual answers. After reviewing the returned links and snippets, call web_fetch_tool on the most relevant target URL to read the webpage body.',
		inputSchema,
		execute: async input => {
			const max_chars = input.max_chars ?? MAX_CHARS
			const jina_api_key = config.jina_api_key?.trim()
			let jina_error = undefined as string | undefined

			if (jina_api_key) {
				try {
					const url = `https://s.jina.ai/?q=${encodeURIComponent(input.query)}`
					const resp = await fetch(url, {
						signal: AbortSignal.timeout(15000),
						headers: {
							Authorization: `Bearer ${jina_api_key}`,
							'X-Respond-With': 'no-content'
						}
					})

					if (!resp.ok) throw new Error(`Jina returned HTTP ${resp.status}`)

					const markdown = await resp.text()

					if (!markdown.trim()) throw new Error('Jina returned empty content')

					return {
						source: 'jina' as const,
						way: { name: 'jina' as const },
						content: markdown.slice(0, max_chars),
						truncated: markdown.length > max_chars,
						must_fetch: true
					}
				} catch (e: unknown) {
					jina_error = e instanceof Error ? e.message : 'Unknown error'
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

				if (!resp.ok) throw new Error(`DuckDuckGo returned HTTP ${resp.status}`)

				const html = await resp.text()
				const markdown = turndown.turndown(html)

				return {
					source: 'direct' as const,
					way: jina_error
						? { name: 'direct' as const, error: jina_error }
						: { name: 'direct' as const },
					content: markdown.slice(0, max_chars),
					truncated: markdown.length > max_chars,
					must_fetch: true
				}
			} catch (e: unknown) {
				const direct_error = e instanceof Error ? e.message : 'Unknown error'

				return {
					source: 'failed' as const,
					way: { name: 'direct' as const, error: direct_error },
					error: direct_error,
					must_fetch: false
				}
			}
		}
	})
}
