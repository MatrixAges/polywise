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
					query: input.query,
					result_type: 'link_list_only',
					next_action: 'call_web_fetch_tool',
					warning: 'Do not treat search result snippets as final evidence. Fetch the target page body with web_fetch_tool before answering.',
					content: markdown.slice(0, max_chars),
					truncated: markdown.length > max_chars
				}
			} catch (e: unknown) {
				const message = e instanceof Error ? e.message : 'Unknown error'

				return {
					query: input.query,
					result_type: 'link_list_only',
					next_action: 'retry_or_refine_search',
					warning: 'Search failed before any target page could be fetched.',
					content: '',
					truncated: false,
					error: message
				}
			}
		}
	})
}
