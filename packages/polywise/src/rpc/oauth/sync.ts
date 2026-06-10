import { config_path, providers_path } from '@core/consts/app'
import { p } from '@core/utils'
import { z } from 'zod'

import { syncOpenAIOAuthProvider } from '../../oauth/openai'
import { syncOpenCodeOAuthProvider } from '../../oauth/opencode'
import { getOAuthProviderDefinition } from '../../oauth/providers'
import { readProviderConfigFile } from '../../oauth/runtime'
import {
	getBaseState,
	getStoredState,
	getSyncedProvider,
	mergeDetectedModels,
	readAppConfigFile,
	saveOAuthProviderState
} from '../../oauth/state'
import { oauth_provider_ids } from '../../oauth/types'

const input_type = z.object({
	id: z.enum(oauth_provider_ids)
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/oauth/sync',
			description:
				'Sync one OAuth-backed provider into local config so its models become selectable without manual API setup.'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		const provider = getOAuthProviderDefinition(input.id)

		if (!provider.sync_supported || !provider.sync_provider_name) {
			throw new Error(`${provider.name} does not support automatic model sync yet.`)
		}
		const sync_result =
			provider.id === 'codex'
				? await syncOpenAIOAuthProvider()
				: await syncOpenCodeOAuthProvider({
						definition: provider
					})
		const { provider: next_provider, models } = sync_result

		const current_app_config = await readAppConfigFile()
		const current_config = await readProviderConfigFile(providers_path)
		const stored_state = getStoredState({
			config: current_app_config,
			id: provider.id
		})
		const synced_provider = getSyncedProvider({
			config: current_config,
			definition: provider
		})
		const current_state = getBaseState({
			stored_state,
			synced_provider
		})
		const next_state = {
			enabled: current_state?.enabled ?? true,
			models: mergeDetectedModels({
				current_state,
				detected_models: models
			}),
			detected_models: models.map(model => ({ ...model }))
		}

		const { provider_config: saved_provider_config } = await saveOAuthProviderState({
			app_config: current_app_config,
			provider_config: current_config,
			id: provider.id,
			state: next_state,
			provider: next_provider,
			config_path,
			providers_path
		})
		const saved_provider = getSyncedProvider({
			config: saved_provider_config,
			definition: provider
		})

		return {
			ok: true as const,
			provider: {
				id: provider.id,
				name: provider.name
			},
			model_count: next_state.models.length,
			detected_model_count: models.length,
			synced_provider_name: saved_provider?.name ?? provider.sync_provider_name
		}
	})
