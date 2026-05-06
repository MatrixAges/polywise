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
			'Search the web using DuckDuckGo. Returns search results as Markdown with titles, URLs, and snippets for the AI to read.',
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
