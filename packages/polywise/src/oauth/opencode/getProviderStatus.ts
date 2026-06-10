import { getEffectiveState, getSyncedProvider, hasCustomizedModels } from '../state'

import type { ProviderConfig } from '@core/types'
import type { AppConfigState } from '../state'
import type { OAuthProviderDefinition } from '../types'
import type { OpenCodeConnectionState } from './types'

export default (args: {
	definition: OAuthProviderDefinition
	app_config: AppConfigState
	provider_config: ProviderConfig
	connection_state: OpenCodeConnectionState
}) => {
	const { definition, app_config, provider_config, connection_state } = args
	const synced_provider = getSyncedProvider({
		config: provider_config,
		definition
	})
	const effective_state = getEffectiveState({
		config: app_config,
		id: definition.id,
		synced_provider: synced_provider ?? null
	})
	const current_models = effective_state?.models ?? synced_provider?.models ?? []
	const detected_models = effective_state?.detected_models ?? synced_provider?.models ?? []
	const matched_credential = connection_state.credentials.find(
		credential => credential.name === (definition.credential_name ?? definition.name)
	)
	const synced = Boolean(synced_provider)

	return {
		...definition,
		installed: connection_state.installed,
		connected: Boolean(matched_credential),
		credential_label: matched_credential?.name ?? null,
		synced,
		editable: synced,
		enabled: effective_state?.enabled ?? synced_provider?.enabled ?? true,
		models: current_models,
		detected_model_count: detected_models.length,
		has_custom_models: hasCustomizedModels(effective_state),
		synced_model_count: current_models.length,
		synced_provider_name: synced_provider?.name ?? definition.sync_provider_name ?? definition.name,
		synced_models: current_models.slice(0, 8).map(model => model.id)
	}
}
