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
	query: string().describe('The search query'),
	max_chars: number().optional().describe('Max characters to return (default 30000)')
})

export const createWebSearchTool = () => {
	return tool({
		description:
			'Search the web using DuckDuckGo. Returns search results as Markdown with titles, URLs, and snippets for the AI to read.',
		inputSchema,
		execute: async input => {
			const max_chars = input.max_chars ?? MAX_CHARS

			try {
				const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(input.query)}`
				const resp = await fetch(url, {
					signal: AbortSignal.timeout(15000),
					headers: {
						'User-Agent':
							'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
						Accept: 'text/html,application/xhtml+xml,*/*',
						'Accept-Language': 'en-US,en;q=0.9'
					}
				})

				if (!resp.ok) throw new Error(`DuckDuckGo returned HTTP ${resp.status}`)

				const html = await resp.text()
				const markdown = turndown.turndown(html)

				return {
					query: input.query,
					content: markdown.slice(0, max_chars),
					truncated: markdown.length > max_chars
				}
			} catch (e: unknown) {
				const message = e instanceof Error ? e.message : 'Unknown error'

				return { query: input.query, content: '', truncated: false, error: message }
			}
		}
	})
}
