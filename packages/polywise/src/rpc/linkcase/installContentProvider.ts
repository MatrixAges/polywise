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

	const outputs: Array<string> = []
	let last_result: Awaited<ReturnType<typeof runShellCommand>> | null = null

	for (const command of provider.install_commands) {
		const result = await runShellCommand(command)
		last_result = result

		if (result.stdout.trim()) {
			outputs.push(`$ ${command}\n${result.stdout.trim()}`)
		}

		if (result.stderr.trim()) {
			outputs.push(`$ ${command}\n${result.stderr.trim()}`)
		}

		const installed = await isToolInstalled(provider.detect)

		if (installed) {
			return {
				ok: result.exitCode === 0,
				installed,
				provider,
				stdout: result.stdout,
				stderr: result.stderr
			}
		}
	}

	throw new Error(
		outputs.join('\n\n') || last_result?.stderr || last_result?.stdout || `Failed to install ${provider.name}`
	)
})
