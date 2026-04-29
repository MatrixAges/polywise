import { preset_providers } from '@core/consts/providers'
import { clearObject, initDefaults, log } from '@core/utils'
import { to } from 'await-to-js'
import fs from 'fs-extra'

import { config_path, providers_path } from '../consts/app'
import { config, providers } from './index'

import type { ConfigProvider, PresetProvider, ProviderConfig } from '@core/types'

const mergeable_provider_keys = ['apiKey', 'baseURL', 'headers', 'models'] as const

const mergePresetProvider = (local_provider: ConfigProvider | undefined, preset_provider: PresetProvider) => {
	if (!local_provider) return { provider: preset_provider, changed: true }

	let changed = false
	const provider = { ...local_provider }
	const values = Object.values(mergeable_provider_keys)

	values.forEach(key => {
		const target_provider = provider as Record<(typeof mergeable_provider_keys)[number], unknown>
		const target_preset = preset_provider as Record<(typeof mergeable_provider_keys)[number], unknown>

		if (target_provider[key] !== undefined || target_preset[key] === undefined) return

		target_provider[key] = target_preset[key]
		changed = true
	})

	return { provider, changed }
}

const mergePresetProviders = (provider_config: ProviderConfig | null | undefined) => {
	const local_providers = provider_config?.providers ?? []
	const local_provider_map = new Map(local_providers.map(item => [item.name, item]))
	let has_changed_provider = false

	const providers = local_providers.map(item => {
		const preset_provider = preset_providers.find(preset => preset.name === item.name)

		if (!preset_provider) return item

		const { provider, changed } = mergePresetProvider(item, preset_provider)

		if (changed) has_changed_provider = true

		return provider
	})

	const missing_providers = preset_providers.filter(item => !local_provider_map.has(item.name))

	return {
		provider_config: {
			...(provider_config ?? {}),
			providers: [...providers, ...missing_providers]
		} as ProviderConfig,
		has_changed_provider: has_changed_provider || missing_providers.length > 0
	}
}

export default async () => {
	const [err_config, res_config] = await to(fs.readJson(config_path))
	const [err_providers, res_providers] = await to(fs.readJson(providers_path, { throws: false }))

	if (err_config || err_providers) return initDefaults()

	clearObject(config)
	Object.assign(config, res_config || {})

	if (!config.mcp) {
		config.mcp = { enabled: true }
	}

	const { provider_config, has_changed_provider } = mergePresetProviders(res_providers)

	clearObject(providers)
	Object.assign(providers, provider_config)

	if (has_changed_provider) {
		await fs.writeJson(providers_path, provider_config, { spaces: 4 })
	}

	log('CONFIG', 'load Config', () => res_config)
	log('CONFIG', 'load Providers', () => provider_config)
}
