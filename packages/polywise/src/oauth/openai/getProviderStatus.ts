import { isToolInstalled } from '../runtime'
import { getEffectiveState, getSyncedProvider, hasCustomizedModels } from '../state'
import probeCodexAuthState from './probeCodexAuthState'
import openai_oauth_provider from './provider'
import readCodexAuthState from './readCodexAuthState'

import type { ProviderConfig } from '@core/types'
import type { AppConfigState } from '../state'

const getCredentialLabel = (auth_mode: string | null | undefined) => {
	return auth_mode === 'chatgpt' ? 'ChatGPT Plus/Pro' : auth_mode || 'Codex'
}

export default async (args: { app_config: AppConfigState; provider_config: ProviderConfig }) => {
	const { app_config, provider_config } = args
	const codex_probe = await probeCodexAuthState().catch(async () => ({
		auth_state: await readCodexAuthState(),
		connected: false
	}))
	const { auth_state: codex_auth, connected: codex_connected } = codex_probe
	const codex_installed = (await isToolInstalled('codex')) || Boolean(codex_auth)
	const synced_provider = getSyncedProvider({
		config: provider_config,
		definition: openai_oauth_provider
	})
	const effective_state = getEffectiveState({
		config: app_config,
		id: openai_oauth_provider.id,
		synced_provider: synced_provider ?? null
	})
	const detected_models = effective_state?.detected_models ?? synced_provider?.models ?? []
	const current_models = effective_state?.models ?? synced_provider?.models ?? detected_models
	const synced = Boolean(synced_provider)

	return {
		...openai_oauth_provider,
		installed: codex_installed,
		connected: codex_connected,
		credential_label: getCredentialLabel(codex_auth?.auth_mode),
		synced,
		editable: synced,
		enabled: effective_state?.enabled ?? synced_provider?.enabled ?? true,
		models: current_models,
		detected_model_count: detected_models.length,
		has_custom_models: hasCustomizedModels(effective_state),
		synced_model_count: current_models.length,
		synced_provider_name:
			synced_provider?.name ?? openai_oauth_provider.sync_provider_name ?? openai_oauth_provider.name,
		synced_models: current_models.slice(0, 8).map(model => model.id)
	}
}
