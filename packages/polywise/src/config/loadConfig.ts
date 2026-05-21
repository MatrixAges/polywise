import { preset_providers } from '@core/consts/providers'
import { default_fetch_fallback_chain } from '@core/types'
import { clearObject, initDefaults, log } from '@core/utils'
import { to } from 'await-to-js'
import fs from 'fs-extra'

import { config_path, providers_path } from '../consts/app'
import { config, providers } from './index'

import type { ConfigProvider, PresetProvider, ProviderConfig } from '@core/types'

const mergeable_provider_keys = ['apiKey', 'baseURL', 'headers', 'models'] as const
const fetch_fallback_provider_set = new Set<string>(default_fetch_fallback_chain)
const default_pthink = {
	enabled: true,
	idle_grace_ms: 20 * 60 * 1000,
	daily_report_enabled: true,
	daily_report_hour: 21,
	weekly_report_enabled: true,
	weekly_report_weekday: 'sun' as const,
	weekly_report_hour: 20,
	trigger_enabled: true,
	max_reports_per_day: 3
}

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
	let has_changed_config = false

	if (!config.mcp) {
		config.mcp = { enabled: true }
		has_changed_config = true
	}

	if (config.jina_api_key === undefined) {
		config.jina_api_key = ''
		has_changed_config = true
	}

	if (!config.rewire || typeof config.rewire !== 'object') {
		config.rewire = {
			enabled: true,
			tick_ms: 120000,
			idle_grace_ms: 30 * 60 * 1000,
			replay_window_ms: 24 * 60 * 60 * 1000,
			max_groups_per_cycle: 20,
			max_edge_creations_per_cycle: 40,
			max_edge_prunes_per_cycle: 40,
			hot_node_degree_limit: 14,
			cold_node_degree_limit: 2,
			monitor_ms: 60000
		}
		has_changed_config = true
	} else {
		const default_rewire = {
			enabled: true,
			tick_ms: 120000,
			idle_grace_ms: 30 * 60 * 1000,
			replay_window_ms: 24 * 60 * 60 * 1000,
			max_groups_per_cycle: 20,
			max_edge_creations_per_cycle: 40,
			max_edge_prunes_per_cycle: 40,
			hot_node_degree_limit: 14,
			cold_node_degree_limit: 2,
			monitor_ms: 60000
		}
		const next_rewire = { ...default_rewire, ...config.rewire }

		if (JSON.stringify(config.rewire) !== JSON.stringify(next_rewire)) {
			config.rewire = next_rewire
			has_changed_config = true
		}
	}

	if (config.enbale_webfetch_chain === undefined) {
		config.enbale_webfetch_chain = false
		has_changed_config = true
	}

	if (!config.pthink || typeof config.pthink !== 'object') {
		config.pthink = { ...default_pthink }
		has_changed_config = true
	} else {
		const next_pthink = { ...default_pthink, ...config.pthink }

		if (JSON.stringify(config.pthink) !== JSON.stringify(next_pthink)) {
			config.pthink = next_pthink
			has_changed_config = true
		}
	}

	if (!Array.isArray(config.fetch_fallback_chain) || !config.fetch_fallback_chain.length) {
		config.fetch_fallback_chain = [...default_fetch_fallback_chain]
		has_changed_config = true
	} else {
		const current_chain = config.fetch_fallback_chain as Array<string>
		const migrated_chain = current_chain
			.map(item => (item === 'curl.md' ? 'crawl4ai' : item))
			.filter(item => fetch_fallback_provider_set.has(item))

		if (
			migrated_chain.length !== current_chain.length ||
			migrated_chain.some((item, index) => item !== current_chain[index])
		) {
			config.fetch_fallback_chain = migrated_chain.length
				? (migrated_chain as typeof config.fetch_fallback_chain)
				: [...default_fetch_fallback_chain]
			has_changed_config = true
		}
	}

	const { provider_config, has_changed_provider } = mergePresetProviders(res_providers)

	clearObject(providers)
	Object.assign(providers, provider_config)

	if (has_changed_config) {
		await fs.writeJson(config_path, config, { spaces: 4 })
	}

	if (has_changed_provider) {
		await fs.writeJson(providers_path, provider_config, { spaces: 4 })
	}

	log('CONFIG', 'load Config', () => res_config)
	log('CONFIG', 'load Providers', () => provider_config)
}
