const LINKCASE_FAVICON_TIMEOUT_MS = 10_000
const LINKCASE_FAVICON_MAX_BYTES = 512 * 1024
const LINKCASE_FAVICON_USER_AGENT =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'

const parseHtmlAttribute = (tag: string, name: string) => {
	const matched = tag.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))

	if (!matched) {
		return ''
	}

	return (matched[2] ?? matched[3] ?? matched[4] ?? '').trim()
}

const looksLikeHtmlDocument = (value: Uint8Array) => {
	const head = new TextDecoder().decode(value.slice(0, 512)).trim().toLowerCase()

	return head.startsWith('<!doctype html') || head.startsWith('<html') || head.startsWith('<head')
}

const isLikelyFaviconResponse = (content_type: string, bytes: Uint8Array) => {
	const normalized_type = content_type.toLowerCase()

	if (
		normalized_type.includes('image/') ||
		normalized_type.includes('svg+xml') ||
		normalized_type.includes('x-icon') ||
		normalized_type.includes('vnd.microsoft.icon')
	) {
		return true
	}

	return !looksLikeHtmlDocument(bytes)
}

const listFaviconCandidates = (source_url: string, html: string) => {
	const matches = html.match(/<link\b[^>]*>/gi) ?? []
	const seen = new Set<string>()
	const results = [] as Array<string>

	for (const tag of matches) {
		const rel = parseHtmlAttribute(tag, 'rel').toLowerCase()
		const href = parseHtmlAttribute(tag, 'href')

		if (!href || !rel.includes('icon')) {
			continue
		}

		try {
			const resolved = new URL(href, source_url).toString()

			if (seen.has(resolved)) {
				continue
			}

			seen.add(resolved)
			results.push(resolved)
		} catch {
			continue
		}
	}

	try {
		const fallback = new URL('/favicon.ico', source_url).toString()

		if (!seen.has(fallback)) {
			seen.add(fallback)
			results.push(fallback)
		}
	} catch {
		return results
	}

	return results
}

const fetchFaviconBytes = async (favicon_url: string) => {
	const response = await fetch(favicon_url, {
		signal: AbortSignal.timeout(LINKCASE_FAVICON_TIMEOUT_MS),
		headers: {
			'User-Agent': LINKCASE_FAVICON_USER_AGENT,
			Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
		}
	})

	if (!response.ok) {
		throw new Error(`HTTP ${response.status}`)
	}

	const bytes = new Uint8Array(await response.arrayBuffer())

	if (bytes.length === 0 || bytes.length > LINKCASE_FAVICON_MAX_BYTES) {
		throw new Error(`Unexpected favicon size: ${bytes.length}`)
	}

	if (!isLikelyFaviconResponse(response.headers.get('content-type') ?? '', bytes)) {
		throw new Error('Response is not a favicon image')
	}

	return bytes
}

export const getLinkFavicon = async (source_url: string) => {
	const candidates = [] as Array<string>

	try {
		const response = await fetch(source_url, {
			signal: AbortSignal.timeout(LINKCASE_FAVICON_TIMEOUT_MS),
			headers: {
				'User-Agent': LINKCASE_FAVICON_USER_AGENT,
				Accept: 'text/html,application/xhtml+xml,*/*'
			}
		})

		if (response.ok) {
			const content_type = (response.headers.get('content-type') ?? '').toLowerCase()

			if (content_type.includes('html') || content_type.includes('xml') || !content_type) {
				const html = await response.text()

				candidates.push(...listFaviconCandidates(source_url, html))
			}
		}
	} catch {
		// Best effort only. Fall back to /favicon.ico below.
	}

	if (candidates.length === 0) {
		try {
			candidates.push(new URL('/favicon.ico', source_url).toString())
		} catch {
			return null
		}
	}

	for (const candidate of candidates) {
		try {
			return await fetchFaviconBytes(candidate)
		} catch {
			continue
		}
	}

	return null
}
