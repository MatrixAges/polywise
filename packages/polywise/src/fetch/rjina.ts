import { config } from '@core/config'

import { trimContent } from './runtime'

import type { FetchProviderHandler } from './types'

const fetchWithRJina: FetchProviderHandler = async ({ url, max_chars }) => {
	const jina_api_key = config.jina_api_key?.trim()
	const resp = await fetch(`https://r.jina.ai/${url}`, {
		signal: AbortSignal.timeout(30000),
		headers: {
			...(jina_api_key ? { Authorization: `Bearer ${jina_api_key}` } : {})
		}
	})

	if (!resp.ok) {
		throw new Error(`Jina returned HTTP ${resp.status}`)
	}

	const markdown = await resp.text()

	if (!markdown.trim()) {
		throw new Error('Jina returned empty content')
	}

	return {
		ok: true,
		source: 'r.jina.ai',
		...trimContent(markdown, max_chars)
	}
}

export default fetchWithRJina
