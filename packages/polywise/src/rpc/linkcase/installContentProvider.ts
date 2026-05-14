import { p } from '@core/utils'
import { z } from 'zod'

import { linkcase_content_providers } from './providers'
import { isToolInstalled, runShellCommand } from './runtime'

const input_type = z.object({
	id: z.enum(linkcase_content_providers.map(item => item.id) as [string, ...string[]])
})

export default p.input(input_type).mutation(async ({ input }) => {
	const provider = linkcase_content_providers.find(item => item.id === input.id)

	if (!provider) {
		throw new Error(`Unknown linkcase provider: ${input.id}`)
	}

	if (await isToolInstalled(provider.detect)) {
		return {
			ok: true,
			installed: true,
			provider
		}
	}

	const result = await runShellCommand(provider.install)
	const installed = await isToolInstalled(provider.detect)

	if (!installed) {
		throw new Error(
			[result.stderr, result.stdout].filter(Boolean).join('\n') || `Failed to install ${provider.name}`
		)
	}

	return {
		ok: result.exitCode === 0,
		installed,
		provider,
		stdout: result.stdout,
		stderr: result.stderr
	}
})
