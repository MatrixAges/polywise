import { runCommand, trimContent } from './runtime'

import type { FetchProviderHandler } from './types'

const fetchWithOpencli: FetchProviderHandler = async ({ url, max_chars }) => {
	const result = await runCommand('opencli', ['web', 'read', '--url', url, '--format', 'md'], 45000)

	if (result.exitCode !== 0) {
		throw new Error(result.stderr || result.stdout || 'opencli failed')
	}

	if (!result.stdout.trim()) {
		throw new Error('opencli returned empty content')
	}

	return {
		ok: true,
		source: 'opencli',
		...trimContent(result.stdout, max_chars)
	}
}

export default fetchWithOpencli
