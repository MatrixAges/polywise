import { p } from '@core/utils'
import { z } from 'zod'

import { oauth_providers } from './providers'
import { isToolInstalled, launchInteractiveLogin } from './runtime'

const input_type = z.object({
	id: z.enum(oauth_providers.map(item => item.id) as [string, ...Array<string>])
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/oauthProvider/connect',
			description:
				'Open a local terminal and start the native OAuth login flow for one configured provider.'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		const provider = oauth_providers.find(item => item.id === input.id)

		if (!provider) {
			throw new Error(`Unknown OAuth provider: ${input.id}`)
		}

		if (!(await isToolInstalled(provider.detect))) {
			throw new Error(`${provider.client} is not installed or not available in PATH.`)
		}

		await launchInteractiveLogin({
			label: provider.name,
			command: provider.connect_command
		})

		return {
			ok: true as const,
			provider
		}
	})
