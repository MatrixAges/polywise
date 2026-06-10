import { config_path, providers_path } from '@core/consts/app'
import { p } from '@core/utils'
import { z } from 'zod'

import { getCodexOauthModels, probeCodexAuthState } from '../../utils/codexOauth'
import { oauth_providers } from './providers'
import { parseOpenCodeModels, readOpenCodeAuthFile, readProviderConfigFile, runShellCommand } from './runtime'
import {
	getBaseState,
	getStoredState,
	getSyncedProvider,
	mergeDetectedModels,
	readAppConfigFile,
	saveOAuthProviderState
} from './shared'

import type { Provider } from '@core/types'

const input_type = z.object({
	id: z.enum(oauth_providers.map(item => item.id) as [string, ...Array<string>])
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/oauthProvider/sync',
			description:
				'Sync one OAuth-backed provider into local config so its models become selectable without manual API setup.'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		const provider = oauth_providers.find(item => item.id === input.id)

		if (!provider) {
			throw new Error(`Unknown OAuth provider: ${input.id}`)
		}

		if (
			!provider.sync_supported ||
			!provider.sync_provider_name ||
			(provider.id !== 'codex' &&
				(!provider.sync_auth_key || !provider.sync_base_url || !provider.sync_models_command))
		) {
			throw new Error(`${provider.name} does not support automatic model sync yet.`)
		}
		let next_provider = null as Provider | null
		let models = [] as Array<Provider['models'][number]>

		if (provider.id === 'codex') {
			const { auth_state: codex_auth, connected: codex_connected } = await probeCodexAuthState()

			if (!codex_auth || !codex_connected) {
				throw new Error('Codex ChatGPT login is missing or expired. Run `codex login` again first.')
			}

			models = getCodexOauthModels()

			next_provider = {
				name: provider.sync_provider_name,
				apiKey: 'chatgpt-oauth',
				baseURL: 'https://chatgpt.com/backend-api',
				enabled: true,
				models,
				custom_fields: {
					provider_runtime: 'codex_oauth',
					auth_mode: codex_auth.auth_mode || 'chatgpt',
					oauth_provider_id: provider.id
				}
			} as Provider
		} else {
			const auth_file = await readOpenCodeAuthFile()
			const auth_entry = auth_file?.[provider.sync_auth_key!]
			const api_key = auth_entry?.key?.trim()

			if (!api_key) {
				throw new Error(`${provider.name} is not logged in locally yet.`)
			}

			const models_result = await runShellCommand(provider.sync_models_command!, 15000)

			if (models_result.exitCode !== 0) {
				throw new Error(
					models_result.stderr.trim() ||
						models_result.stdout.trim() ||
						`Failed to list models for ${provider.name}.`
				)
			}

			models = parseOpenCodeModels(models_result.stdout)

			if (models.length === 0) {
				throw new Error(`No models were returned for ${provider.name}.`)
			}

			next_provider = {
				name: provider.sync_provider_name,
				apiKey: api_key,
				baseURL: provider.sync_base_url!,
				enabled: true,
				models,
				custom_fields: {
					provider_runtime: 'opencode_oauth',
					oauth_provider_id: provider.id
				}
			} as Provider
		}

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
			provider: next_provider!,
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
