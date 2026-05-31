import { p } from '@core/utils'
import { z } from 'zod'

import { linkcase_content_providers } from './providers'
import { isToolInstalled, runShellCommand } from './runtime'

const input_type = z.object({
	id: z.enum(linkcase_content_providers.map(item => item.id) as [string, ...string[]])
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/linkcase/installContentProvider',
			description: 'Install the CLI or local dependency required by one linkcase content provider.'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
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

		for (const install_item of provider.install_commands) {
			const install_command =
				typeof install_item === 'string'
					? { command: install_item, timeout_ms: 10 * 60 * 1000 }
					: {
							command: install_item.command,
							timeout_ms: install_item.timeout_ms ?? 10 * 60 * 1000
						}
			const result = await runShellCommand(install_command.command, install_command.timeout_ms)
			last_result = result

			if (result.stdout.trim()) {
				outputs.push(`$ ${install_command.command}\n${result.stdout.trim()}`)
			}

			if (result.stderr.trim()) {
				outputs.push(`$ ${install_command.command}\n${result.stderr.trim()}`)
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

			if (result.exitCode !== 0) {
				break
			}
		}

		throw new Error(
			outputs.join('\n\n') ||
				last_result?.stderr ||
				last_result?.stdout ||
				`Failed to install ${provider.name}`
		)
	})
