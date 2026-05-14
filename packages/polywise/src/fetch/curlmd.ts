import { runCommand, trimContent } from './runtime'

import type { FetchProviderHandler } from './types'

const fetchWithCurlMd: FetchProviderHandler = async ({ url, max_chars }) => {
	const result = await runCommand('curl.md', ['fetch', url], 45000)

	if (result.exitCode !== 0) {
		throw new Error(result.stderr || result.stdout || 'curl.md failed')
	}

	if (!result.stdout.trim()) {
		throw new Error('curl.md returned empty content')
	}

	return {
		ok: true,
		source: 'curl.md',
		...trimContent(result.stdout, max_chars)
	}
}

export default fetchWithCurlMd
