import { config as live_config, providers as live_providers } from '@core/config'
import { config_path } from '@core/consts/app'
import { clearObject } from '@core/utils'
import fs from 'fs-extra'

import { readJsonFile } from './runtime'

import type { AppConfig, OAuthProviderState, Provider, ProviderConfig } from '@core/types'
import type { OAuthProviderDefinition, OAuthProviderId } from './types'

export type AppConfigState = Partial<AppConfig>

type ProviderModel = Provider['models'][number]
type OAuthManagedProvider = Provider & {
	custom_fields?: Record<string, string>
}

const cloneModels = (models: Array<ProviderModel>) => models.map(model => ({ ...model }))

const cloneState = (state: OAuthProviderState) => ({
	enabled: state.enabled,
	models: cloneModels(state.models),
	detected_models: cloneModels(state.detected_models)
})

const getLiveConfigSnapshot = () => JSON.parse(JSON.stringify(live_config)) as AppConfigState

const getProviderCustomFields = (provider: Provider | null | undefined) => {
	if (!provider || typeof provider !== 'object' || !('custom_fields' in provider)) {
		return null
	}

	const custom_fields = (provider as OAuthManagedProvider).custom_fields

	return custom_fields && typeof custom_fields === 'object' ? custom_fields : null
}

const getManagedProviderId = (provider: Provider | null | undefined) => {
	return getProviderCustomFields(provider)?.oauth_provider_id ?? null
}

const isCodexOAuthProvider = (provider: Provider | null | undefined) => {
	const custom_fields = getProviderCustomFields(provider)

	return custom_fields?.provider_runtime === 'codex_oauth' || custom_fields?.oauth_provider_id === 'codex'
}

const isManagedProvider = (provider: Provider | null | undefined) => {
	const custom_fields = getProviderCustomFields(provider)
	const provider_runtime = custom_fields?.provider_runtime?.trim()

	return (
		Boolean(custom_fields?.oauth_provider_id?.trim()) ||
		provider_runtime === 'codex_native' ||
		provider_runtime === 'codex_oauth' ||
		provider_runtime === 'opencode_oauth'
	)
}

const buildUniqueProviderName = (args: { provider_name: string; providers: Array<Provider> }) => {
	const { provider_name, providers } = args
	const provider_name_set = new Set(providers.map(item => item.name))

	if (!provider_name_set.has(provider_name)) {
		return provider_name
	}

	const oauth_name = `${provider_name} (OAuth)`

	if (!provider_name_set.has(oauth_name)) {
		return oauth_name
	}

	let index = 2

	while (provider_name_set.has(`${oauth_name} ${index}`)) {
		index += 1
	}

	return `${oauth_name} ${index}`
}

const matchesManagedProviderFamily = (args: { existing_provider: Provider; provider: Provider }) => {
	const { existing_provider, provider } = args
	const candidate_name = existing_provider.name.trim()
	const provider_name = provider.name.trim()

	return (
		existing_provider.baseURL === provider.baseURL &&
		(candidate_name === provider_name || candidate_name === `${provider_name} (OAuth)`)
	)
}

const getCustomProviderTargetIndex = (args: { providers: Array<Provider>; provider: Provider }) => {
	const { providers, provider } = args
	const provider_id = getManagedProviderId(provider)

	if (provider_id !== null) {
		const managed_index = providers.findIndex(item => getManagedProviderId(item) === provider_id)

		if (isManagedProvider(provider)) {
			const exact_name_index = providers.findIndex(item => item.name === provider.name)

			if (exact_name_index >= 0) {
				return exact_name_index
			}

			if (managed_index >= 0) {
				return managed_index
			}

			const family_index = providers.findIndex(item =>
				matchesManagedProviderFamily({
					existing_provider: item,
					provider
				})
			)

			if (family_index >= 0) {
				return family_index
			}
		}

		if (managed_index >= 0) {
			return managed_index
		}
	}

	return providers.findIndex(item => item.name === provider.name)
}

const getCustomProviderWriteName = (args: {
	providers: Array<Provider>
	provider: Provider
	target_index: number | null
}) => {
	const { providers, provider, target_index } = args
	const sibling_providers =
		target_index === null ? providers : providers.filter((_, index) => index !== target_index)

	if (isManagedProvider(provider) && !sibling_providers.some(item => item.name === provider.name)) {
		return provider.name
	}

	return buildUniqueProviderName({
		provider_name: provider.name,
		providers: sibling_providers
	})
}

const dedupeCustomProviders = (args: { providers: Array<Provider>; target_index: number }) => {
	const { providers, target_index } = args
	const target_provider = providers[target_index]
	const provider_id = getManagedProviderId(target_provider)

	if (provider_id === null || !isManagedProvider(target_provider)) {
		return providers
	}

	return providers.filter((item, index) => {
		if (index === target_index) {
			return true
		}

		if (getManagedProviderId(item) === provider_id) {
			return false
		}

		return !matchesManagedProviderFamily({
			existing_provider: item,
			provider: target_provider
		})
	})
}

const upsertManagedProvider = (args: { config: ProviderConfig; provider: Provider }) => {
	const { config, provider } = args
	const next_managed_providers = [...(config.managed_providers ?? [])]
	const raw_target_index = getCustomProviderTargetIndex({
		providers: next_managed_providers,
		provider
	})
	const target_index = raw_target_index >= 0 ? raw_target_index : null
	const next_provider = {
		...provider,
		name: getCustomProviderWriteName({
			providers: next_managed_providers,
			provider,
			target_index
		})
	}
	let deduped_managed_providers = next_managed_providers
	let next_target_index = target_index

	if (target_index !== null) {
		deduped_managed_providers[target_index] = next_provider
	} else {
		deduped_managed_providers.push(next_provider)
		next_target_index = deduped_managed_providers.length - 1
	}

	deduped_managed_providers = dedupeCustomProviders({
		providers: deduped_managed_providers,
		target_index: next_target_index!
	})

	return {
		...config,
		managed_providers: deduped_managed_providers
	} satisfies ProviderConfig
}

const getModelSignature = (models: Array<ProviderModel>) => {
	return JSON.stringify(
		models.map(model => ({
			id: model.id,
			name: model.name,
			enabled: model.enabled,
			type: model.type,
			fid: model.fid
		}))
	)
}

export const readAppConfigFile = async () => {
	return (await readJsonFile<AppConfigState>(config_path)) ?? getLiveConfigSnapshot()
}

export const getSyncedProvider = (args: { config: ProviderConfig; definition: OAuthProviderDefinition }) => {
	const { config, definition } = args

	if (!definition.sync_provider_name) {
		return null
	}

	const managed_providers = config.managed_providers ?? []
	const matched_by_id = managed_providers.find(item => {
		const custom_fields = getProviderCustomFields(item)

		return custom_fields?.oauth_provider_id === definition.id
	})

	if (matched_by_id) {
		return matched_by_id
	}

	if (definition.id === 'codex') {
		return (
			managed_providers.find(
				item => item.name === definition.sync_provider_name && isCodexOAuthProvider(item)
			) ?? null
		)
	}

	const legacy_custom_providers = config.custom_providers ?? []
	const legacy_match_by_id = legacy_custom_providers.find(item => {
		const custom_fields = getProviderCustomFields(item)

		return custom_fields?.oauth_provider_id === definition.id
	})

	if (legacy_match_by_id) {
		return legacy_match_by_id
	}

	return null
}

export const getStoredState = (args: { config: AppConfigState; id: OAuthProviderId }) => {
	const { config, id } = args
	const state = config.oauth_providers?.[id]

	return state ? cloneState(state) : null
}

export const getEffectiveState = (args: {
	config: AppConfigState
	id: OAuthProviderId
	synced_provider: Provider | null
	allow_orphan_state?: boolean
}) => {
	const { config, id, synced_provider, allow_orphan_state = false } = args
	const stored_state = getStoredState({ config, id })

	if (stored_state && (synced_provider || allow_orphan_state)) {
		return stored_state
	}

	if (!synced_provider) {
		return null
	}

	return {
		enabled: synced_provider.enabled,
		models: cloneModels(synced_provider.models),
		detected_models: cloneModels(synced_provider.models)
	} satisfies OAuthProviderState
}

export const saveOAuthProviderState = async (args: {
	app_config: AppConfigState
	provider_config: ProviderConfig
	id: OAuthProviderId
	state: OAuthProviderState
	provider: Provider
	config_path: string
	providers_path: string
}) => {
	const { app_config, provider_config, id, state, provider, config_path: app_config_path, providers_path } = args
	const next_app_config = {
		...app_config,
		oauth_providers: {
			...(app_config.oauth_providers ?? {}),
			[id]: cloneState(state)
		}
	} satisfies AppConfigState
	const next_provider_config = upsertManagedProvider({
		config: provider_config,
		provider: {
			...provider,
			enabled: state.enabled,
			models: cloneModels(state.models)
		}
	})

	await fs.writeJson(providers_path, next_provider_config, { spaces: 4 })
	await fs.writeJson(app_config_path, next_app_config, { spaces: 4 })

	live_config.oauth_providers = next_app_config.oauth_providers

	clearObject(live_providers)
	Object.assign(live_providers, next_provider_config)

	return {
		app_config: next_app_config,
		provider_config: next_provider_config
	}
}

export const hasCustomizedModels = (state: OAuthProviderState | null) => {
	if (!state) {
		return false
	}

	return getModelSignature(state.models) !== getModelSignature(state.detected_models)
}

export const getBaseState = (args: { stored_state: OAuthProviderState | null; synced_provider: Provider | null }) => {
	const { stored_state, synced_provider } = args

	if (stored_state) {
		return cloneState(stored_state)
	}

	if (!synced_provider) {
		return null
	}

	return {
		enabled: synced_provider.enabled,
		models: cloneModels(synced_provider.models),
		detected_models: cloneModels(synced_provider.models)
	} satisfies OAuthProviderState
}

export const mergeDetectedModels = (args: {
	current_state: OAuthProviderState | null
	detected_models: Array<ProviderModel>
}) => {
	const { current_state, detected_models } = args
	const current_model_map = new Map((current_state?.models ?? []).map(model => [model.id, model] as const))
	const previous_detected_id_set = new Set((current_state?.detected_models ?? []).map(model => model.id))
	const detected_id_set = new Set(detected_models.map(model => model.id))
	const merged_detected_models = detected_models.map(model => {
		const current_model = current_model_map.get(model.id)

		return current_model
			? {
					...model,
					enabled: current_model.enabled
				}
			: { ...model }
	})
	const custom_models = (current_state?.models ?? [])
		.filter(model => !previous_detected_id_set.has(model.id))
		.filter(model => !detected_id_set.has(model.id))
		.map(model => ({ ...model }))

	return [...merged_detected_models, ...custom_models]
}
