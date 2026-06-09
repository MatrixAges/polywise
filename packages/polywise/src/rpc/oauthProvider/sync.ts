import { providers as live_providers } from '@core/config'
import { providers_path } from '@core/consts/app'
import { clearObject, p } from '@core/utils'
import fs from 'fs-extra'
import { z } from 'zod'

import { oauth_providers } from './providers'
import { parseOpenCodeModels, readOpenCodeAuthFile, readProviderConfigFile, runShellCommand } from './runtime'

import type { Provider, ProviderConfig } from '@core/types'

const input_type = z.object({
	id: z.enum(oauth_providers.map(item => item.id) as [string, ...Array<string>])
})

const upsertCustomProvider = (args: { config: ProviderConfig; provider: Provider }) => {
	const { config, provider } = args
	const next_custom_providers = [...(config.custom_providers ?? [])]
	const target_index = next_custom_providers.findIndex(item => item.name === provider.name)

	if (target_index >= 0) {
		next_custom_providers[target_index] = provider
	} else {
		next_custom_providers.push(provider)
	}

	return {
		...config,
		custom_providers: next_custom_providers
	} satisfies ProviderConfig
}

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/oauthProvider/sync',
			description:
				'Sync one OAuth-backed provider into providers.json so its models become selectable without manual API setup.'
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
			!provider.sync_auth_key ||
			!provider.sync_base_url ||
			!provider.sync_models_command
		) {
			throw new Error(`${provider.name} does not support automatic model sync yet.`)
		}

		const auth_file = await readOpenCodeAuthFile()
		const auth_entry = auth_file?.[provider.sync_auth_key]
		const api_key = auth_entry?.key?.trim()

		if (!api_key) {
			throw new Error(`${provider.name} is not logged in locally yet.`)
		}

		const models_result = await runShellCommand(provider.sync_models_command, 15000)

		if (models_result.exitCode !== 0) {
			throw new Error(
				models_result.stderr.trim() ||
					models_result.stdout.trim() ||
					`Failed to list models for ${provider.name}.`
			)
		}

		const models = parseOpenCodeModels(models_result.stdout)

		if (models.length === 0) {
			throw new Error(`No models were returned for ${provider.name}.`)
		}

		const current_config = await readProviderConfigFile(providers_path)
		const next_provider = {
			name: provider.sync_provider_name,
			apiKey: api_key,
			baseURL: provider.sync_base_url,
			enabled: true,
			models
		} satisfies Provider
		const next_config = upsertCustomProvider({
			config: current_config,
			provider: next_provider
		})

		await fs.writeJson(providers_path, next_config, { spaces: 4 })

		clearObject(live_providers)
		Object.assign(live_providers, next_config)

		return {
			ok: true as const,
			provider: {
				id: provider.id,
				name: provider.name
			},
			model_count: models.length,
			synced_provider_name: provider.sync_provider_name
		}
	})
