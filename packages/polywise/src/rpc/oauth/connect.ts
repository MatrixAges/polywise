import { p } from '@core/utils'
import { z } from 'zod'

import { getOAuthProviderDefinition } from '../../oauth/providers'
import { isToolInstalled, launchInteractiveLogin } from '../../oauth/runtime'
import { oauth_provider_ids } from '../../oauth/types'

const input_type = z.object({
	id: z.enum(oauth_provider_ids)
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/oauth/connect',
			description:
				'Open a local terminal and start the native OAuth login flow for one configured provider.'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		const provider = getOAuthProviderDefinition(input.id)
		console.log('[rpc.oauth.connect] request', {
			id: input.id,
			name: provider.name,
			command: provider.connect_command
		})

		if (!(await isToolInstalled(provider.detect))) {
			throw new Error(`${provider.client} is not installed or not available in PATH.`)
		}

		await launchInteractiveLogin({
			label: provider.name,
			command: provider.connect_command
		})
		console.log('[rpc.oauth.connect] launched', {
			id: input.id,
			name: provider.name
		})

		return {
			ok: true as const,
			provider
		}
	})
