import { htmlToMarkdown, trimContent } from './runtime'

import type { FetchProviderHandler } from './types'

const fetchDirect: FetchProviderHandler = async ({ url, max_chars }) => {
	const resp = await fetch(url, {
		signal: AbortSignal.timeout(15000),
		headers: {
			'User-Agent':
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
			Accept: 'text/html,application/xhtml+xml,*/*'
		}
	})

	if (!resp.ok) {
		throw new Error(`HTTP ${resp.status}`)
	}

	const html = await resp.text()
	const markdown = htmlToMarkdown(html)

	if (!markdown.trim()) {
		throw new Error('Direct fetch returned empty content')
	}

	return {
		ok: true,
		source: 'direct',
		...trimContent(markdown, max_chars)
	}
}

export default fetchDirect
