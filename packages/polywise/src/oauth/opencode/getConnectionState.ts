import { isToolInstalled, runShellCommand } from '../runtime'
import parseOpenCodeCredentials from './parseOpenCodeCredentials'

import type { OpenCodeConnectionState } from './types'

export default async () => {
	const installed = await isToolInstalled('opencode')

	if (!installed) {
		return {
			installed: false,
			credentials: []
		} satisfies OpenCodeConnectionState
	}

	const opencode_status = await runShellCommand('opencode providers list', 10000)

	return {
		installed: true,
		credentials: parseOpenCodeCredentials(`${opencode_status.stdout}\n${opencode_status.stderr}`)
	} satisfies OpenCodeConnectionState
}
