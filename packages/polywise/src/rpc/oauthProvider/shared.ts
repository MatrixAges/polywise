import { config as live_config, providers as live_providers } from '@core/config'
import { config_path } from '@core/consts/app'
import { clearObject } from '@core/utils'
import fs from 'fs-extra'

import { oauth_providers } from './providers'
import { readJsonFile } from './runtime'

import type { AppConfig, OAuthProviderState, Provider, ProviderConfig } from '@core/types'
import type { OAuthProviderDefinition, OAuthProviderId } from './providers'

type AppConfigState = Partial<AppConfig>
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

export const readAppConfigFile = async () => {
	return (await readJsonFile<AppConfigState>(config_path)) ?? getLiveConfigSnapshot()
}

export const getOAuthProviderDefinition = (id: OAuthProviderId) => {
	const provider = oauth_providers.find(item => item.id === id)

	if (!provider) {
		throw new Error(`Unknown OAuth provider: ${id}`)
	}

	return provider
}

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

export const isCodexOAuthProvider = (provider: Provider | null | undefined) => {
	const custom_fields = getProviderCustomFields(provider)

	return custom_fields?.provider_runtime === 'codex_oauth' || custom_fields?.oauth_provider_id === 'codex'
}

export const getSyncedProvider = (args: { config: ProviderConfig; definition: OAuthProviderDefinition }) => {
	const { config, definition } = args

	if (!definition.sync_provider_name) {
		return null
	}

	const custom_providers = config.custom_providers ?? []
	const matched_by_id = custom_providers.find(item => {
		const custom_fields = getProviderCustomFields(item)

		return custom_fields?.oauth_provider_id === definition.id
	})

	if (matched_by_id) {
		return matched_by_id
	}

	if (definition.id === 'codex') {
		return (
			custom_providers.find(
				item => item.name === definition.sync_provider_name && isCodexOAuthProvider(item)
			) ?? null
		)
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

const upsertCustomProvider = (args: { config: ProviderConfig; provider: Provider }) => {
	const { config, provider } = args
	const next_custom_providers = [...(config.custom_providers ?? [])]
	const provider_id = getManagedProviderId(provider)
	const target_index =
		provider_id !== null
			? next_custom_providers.findIndex(item => getManagedProviderId(item) === provider_id)
			: next_custom_providers.findIndex(item => item.name === provider.name)

	if (target_index >= 0) {
		next_custom_providers[target_index] = provider
	} else {
		next_custom_providers.push({
			...provider,
			name: buildUniqueProviderName({
				provider_name: provider.name,
				providers: next_custom_providers
			})
		})
	}

	return {
		...config,
		custom_providers: next_custom_providers
	} satisfies ProviderConfig
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
	const next_provider_config = upsertCustomProvider({
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
