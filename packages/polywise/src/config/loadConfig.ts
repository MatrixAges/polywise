import { preset_providers } from '@core/consts/providers'
import { resetRemoteEmbeddingRunner } from '@core/pipeline/genEmbedding'
import { resetRemoteRerankRunner } from '@core/pipeline/genRerank'
import { default_fetch_fallback_chain } from '@core/types'
import { clearObject, initDefaults, log } from '@core/utils'
import { to } from 'await-to-js'
import fs from 'fs-extra'

import { config_path, providers_path } from '../consts/app'
import { config, providers } from './index'

import type {
	AppReportConfig,
	ConfigProvider,
	DefaultModel,
	PresetProvider,
	Provider,
	ProviderConfig
} from '@core/types'

const mergeable_provider_keys = ['apiKey', 'baseURL', 'headers', 'models'] as const
const fetch_fallback_provider_set = new Set<string>(default_fetch_fallback_chain)
type ManagedProvider = Provider & {
	custom_fields?: Record<string, string>
}
const default_pthink = {
	enabled: true,
	idle_grace_ms: 20 * 60 * 1000,
	review_cooldown_ms: 15 * 60 * 1000,
	min_messages: 60,
	max_messages: 60,
	max_articles_per_run: 4,
	skill_generation_enabled: true,
	tool_generation_enabled: true
}
const default_report: AppReportConfig = {
	enabled: true,
	daily_enabled: true,
	daily_time: '21:00',
	weekly_enabled: false,
	weekly_weekday: 'sun',
	weekly_time: '21:00',
	monthly_enabled: false,
	monthly_mode: 'last_day',
	monthly_time: '21:00',
	yearly_enabled: false,
	yearly_mode: 'last_day',
	yearly_time: '21:00'
}
const default_auth = {
	enabled: false
}
const default_workspace_name = 'Default'
const default_submit_mode = 'enter' as const
const isValidDefaultModel = (value: unknown): value is DefaultModel => {
	if (!value || typeof value !== 'object') {
		return false
	}

	const { provider, model } = value as Partial<DefaultModel>

	return typeof provider === 'string' && provider.trim() !== '' && typeof model === 'string' && model.trim() !== ''
}

const getProviderCustomFields = (provider: Provider | null | undefined) => {
	if (!provider || typeof provider !== 'object' || !('custom_fields' in provider)) {
		return null
	}

	const custom_fields = (provider as ManagedProvider).custom_fields

	return custom_fields && typeof custom_fields === 'object' ? custom_fields : null
}

const isManagedProvider = (provider: Provider | null | undefined) => {
	const custom_fields = getProviderCustomFields(provider)
	const provider_runtime = custom_fields?.provider_runtime?.trim()
	const oauth_provider_id = custom_fields?.oauth_provider_id?.trim()

	return (
		Boolean(oauth_provider_id) ||
		provider_runtime === 'codex_native' ||
		provider_runtime === 'codex_oauth' ||
		provider_runtime === 'opencode_oauth'
	)
}

const getManagedProviderKey = (provider: Provider) => {
	const custom_fields = getProviderCustomFields(provider)
	const oauth_provider_id = custom_fields?.oauth_provider_id?.trim()
	const provider_runtime = custom_fields?.provider_runtime?.trim() || 'managed'

	return oauth_provider_id || `${provider_runtime}::${provider.name}::${provider.baseURL}`
}

const migrateManagedProviders = (provider_config: ProviderConfig | null | undefined) => {
	const current_provider_config = provider_config ?? { providers: [] }
	const current_custom_providers = current_provider_config.custom_providers ?? []
	const current_managed_providers = current_provider_config.managed_providers ?? []
	const next_custom_providers = current_custom_providers.filter(item => !isManagedProvider(item))
	const extracted_managed_providers = current_custom_providers.filter(item => isManagedProvider(item))
	const managed_provider_map = new Map<string, Provider>()

	current_managed_providers.forEach(item => {
		managed_provider_map.set(getManagedProviderKey(item), item)
	})

	extracted_managed_providers.forEach(item => {
		managed_provider_map.set(getManagedProviderKey(item), item)
	})

	const next_managed_providers = Array.from(managed_provider_map.values())
	const has_changed_provider =
		next_custom_providers.length !== current_custom_providers.length ||
		next_managed_providers.length !== current_managed_providers.length ||
		JSON.stringify(next_managed_providers) !== JSON.stringify(current_managed_providers)

	return {
		provider_config: {
			...current_provider_config,
			custom_providers: next_custom_providers,
			managed_providers: next_managed_providers
		} satisfies ProviderConfig,
		has_changed_provider
	}
}

const getDefaultConfigModel = (args: {
	provider_config: ProviderConfig | null | undefined
	type: 'text' | 'embedding' | 'rerank'
}) => {
	const { provider_config, type } = args
	const providers = [
		...(provider_config?.providers ?? []),
		...(provider_config?.custom_providers ?? []),
		...(provider_config?.managed_providers ?? [])
	] as Array<Pick<Provider, 'name' | 'models'>>

	for (const provider of providers) {
		const matched_model =
			provider.models.find(model => model.enabled !== false && model.type === type) ??
			(type === 'text'
				? provider.models.find(
						model => model.enabled !== false && (!model.type || model.type === 'text')
					)
				: undefined)

		if (!matched_model) {
			continue
		}

		return {
			provider: provider.name,
			model: matched_model.id
		} satisfies DefaultModel
	}

	for (const provider of providers) {
		const fallback_model = provider.models.find(model => model.enabled !== false)

		if (!fallback_model) {
			continue
		}

		return {
			provider: provider.name,
			model: fallback_model.id
		} satisfies DefaultModel
	}

	const preset_provider = preset_providers[0]
	const preset_model = preset_provider?.models[0]

	return {
		provider: preset_provider?.name || 'google_gemini',
		model: preset_model?.id || 'gemini-3.1-pro-preview'
	} satisfies DefaultModel
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

	const { provider_config: migrated_provider_config, has_changed_provider: has_changed_managed_provider } =
		migrateManagedProviders(res_providers)
	const { provider_config, has_changed_provider: has_changed_preset_provider } =
		mergePresetProviders(migrated_provider_config)
	const has_changed_provider = has_changed_managed_provider || has_changed_preset_provider
	const default_model = getDefaultConfigModel({
		provider_config,
		type: 'text'
	})
	const default_embedding_model = getDefaultConfigModel({
		provider_config,
		type: 'embedding'
	})
	const default_rerank_model = getDefaultConfigModel({
		provider_config,
		type: 'rerank'
	})

	clearObject(config)
	Object.assign(config, res_config || {})
	let has_changed_config = false

	if (!Array.isArray(config.workspaces) || config.workspaces.length === 0) {
		config.workspaces = [{ name: default_workspace_name }]
		has_changed_config = true
	}

	if (
		typeof config.current_workspace !== 'string' ||
		!config.current_workspace.trim() ||
		!config.workspaces.some(workspace => workspace?.name === config.current_workspace)
	) {
		config.current_workspace = config.workspaces[0]?.name || default_workspace_name
		has_changed_config = true
	}

	if (config.submit_mode !== 'enter' && config.submit_mode !== 'ctrl+enter') {
		config.submit_mode = default_submit_mode
		has_changed_config = true
	}

	if (!isValidDefaultModel(config.default_model)) {
		config.default_model = default_model
		has_changed_config = true
	}

	if (!isValidDefaultModel(config.embedding_model)) {
		config.embedding_model = default_embedding_model
		has_changed_config = true
	}

	if (!isValidDefaultModel(config.rerank_model)) {
		config.rerank_model = default_rerank_model
		has_changed_config = true
	}

	if (typeof config.enable_triple !== 'boolean') {
		config.enable_triple = false
		has_changed_config = true
	}

	if (!isValidDefaultModel(config.triple_model)) {
		config.triple_model = default_model
		has_changed_config = true
	}

	if (typeof config.enable_rewrite !== 'boolean') {
		config.enable_rewrite = false
		has_changed_config = true
	}

	if (!isValidDefaultModel(config.rewrite_model)) {
		config.rewrite_model = default_model
		has_changed_config = true
	}

	if (!config.mcp) {
		config.mcp = { enabled: true }
		has_changed_config = true
	}

	if (config.jina_api_key === undefined) {
		config.jina_api_key = ''
		has_changed_config = true
	}

	if (config.page_bridge_enabled === undefined) {
		config.page_bridge_enabled = false
		has_changed_config = true
	}

	if (config.prompt_full_inject === undefined) {
		config.prompt_full_inject = false
		has_changed_config = true
	}

	if (config.bookmark_auto_clean === undefined) {
		config.bookmark_auto_clean = false
		has_changed_config = true
	}

	if (config.agent_export_dir === undefined) {
		config.agent_export_dir = ''
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

	if (!config.report || typeof config.report !== 'object') {
		config.report = { ...default_report }
		has_changed_config = true
	} else {
		const next_report = { ...default_report, ...config.report }

		if (JSON.stringify(config.report) !== JSON.stringify(next_report)) {
			config.report = next_report
			has_changed_config = true
		}
	}

	if (!config.auth || typeof config.auth !== 'object') {
		config.auth = { ...default_auth }
		has_changed_config = true
	} else {
		const next_auth = { ...default_auth, ...config.auth }

		if (JSON.stringify(config.auth) !== JSON.stringify(next_auth)) {
			config.auth = next_auth
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

	clearObject(providers)
	Object.assign(providers, provider_config)

	resetRemoteEmbeddingRunner()
	resetRemoteRerankRunner()

	if (has_changed_config) {
		await fs.writeJson(config_path, config, { spaces: 4 })
	}

	if (has_changed_provider) {
		await fs.writeJson(providers_path, provider_config, { spaces: 4 })
	}

	log('CONFIG', 'load Config', () => res_config)
	log('CONFIG', 'load Providers', () => provider_config)
}
