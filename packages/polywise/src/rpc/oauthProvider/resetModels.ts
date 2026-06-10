import { config_path, providers_path } from '@core/consts/app'
import { p } from '@core/utils'
import { z } from 'zod'

import { oauth_providers } from './providers'
import { readProviderConfigFile } from './runtime'
import {
	getEffectiveState,
	getOAuthProviderDefinition,
	getSyncedProvider,
	readAppConfigFile,
	saveOAuthProviderState
} from './shared'

const input_type = z.object({
	id: z.enum(oauth_providers.map(item => item.id) as [string, ...Array<string>])
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/oauthProvider/resetModels',
			description: 'Reset one synced OAuth provider back to its detected model list.'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		const provider = getOAuthProviderDefinition(input.id)
		const current_app_config = await readAppConfigFile()
		const current_provider_config = await readProviderConfigFile(providers_path)
		const synced_provider = getSyncedProvider({
			config: current_provider_config,
			definition: provider
		})
		const effective_state = getEffectiveState({
			config: current_app_config,
			id: input.id,
			synced_provider
		})

		if (!effective_state || !synced_provider) {
			throw new Error(`${provider.name} has not been synced locally yet.`)
		}

		await saveOAuthProviderState({
			app_config: current_app_config,
			provider_config: current_provider_config,
			id: input.id,
			state: {
				...effective_state,
				models: effective_state.detected_models.map(model => ({ ...model }))
			},
			provider: synced_provider,
			config_path,
			providers_path
		})

		return {
			ok: true as const,
			provider: {
				id: provider.id,
				name: provider.name
			},
			model_count: effective_state.detected_models.length
		}
	})
