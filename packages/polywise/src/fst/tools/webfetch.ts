import { config } from '@core/config'
import { tool } from 'ai'
import TurndownService from 'turndown'
import { number, object, url } from 'zod'

const turndown = new TurndownService({
	headingStyle: 'atx',
	hr: '---',
	bulletListMarker: '-',
	codeBlockStyle: 'fenced',
	emDelimiter: '*'
})

turndown.remove(['script', 'style', 'meta', 'link'])

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
			const jina_api_key = config.jina_api_key?.trim()
			const diagnostics: {
				jina_status?: number
				jina_error?: string
				direct_status?: number
				direct_error?: string
			} = {}

			try {
				const resp = await fetch(`https://r.jina.ai/${input.url}`, {
					signal: AbortSignal.timeout(15000),
					headers: {
						Accept: 'text/plain',
						...(jina_api_key ? { Authorization: `Bearer ${jina_api_key}` } : {})
					}
				})

				diagnostics.jina_status = resp.status

				if (!resp.ok) throw new Error(`Jina returned HTTP ${resp.status}`)

				const markdown = await resp.text()

				if (!markdown.trim()) throw new Error('Jina returned empty content')

				return {
					url: input.url,
					source: 'jina' as const,
					content: markdown.slice(0, max_chars),
					truncated: markdown.length > max_chars,
					...diagnostics
				}
			} catch (e: unknown) {
				diagnostics.jina_error = e instanceof Error ? e.message : 'Unknown error'

				try {
					const resp = await fetch(input.url, {
						signal: AbortSignal.timeout(15000),
						headers: {
							'User-Agent':
								'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
							Accept: 'text/html,application/xhtml+xml,*/*'
						}
					})

					diagnostics.direct_status = resp.status

					if (!resp.ok) throw new Error(`HTTP ${resp.status}`)

					const html = await resp.text()
					const markdown = turndown.turndown(html)

					return {
						url: input.url,
						source: 'direct' as const,
						content: markdown.slice(0, max_chars),
						truncated: markdown.length > max_chars,
						...diagnostics
					}
				} catch (e: unknown) {
					diagnostics.direct_error = e instanceof Error ? e.message : 'Unknown error'

					return {
						url: input.url,
						source: 'failed' as const,
						content: '',
						truncated: false,
						error: diagnostics.direct_error,
						...diagnostics
					}
				}
			}
		}
	})
}
