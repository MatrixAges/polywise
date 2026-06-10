import { config as app_config, providers as provider_config } from '@core/config'
import { p } from '@core/utils'

import { probeCodexAuthState, readCodexAuthState } from '../../utils/codexOauth'
import { oauth_providers } from './providers'
import { isToolInstalled, parseOpenCodeCredentials, runShellCommand } from './runtime'
import { getEffectiveState, getSyncedProvider, hasCustomizedModels } from './shared'

export default p
	.meta({
		openapi: {
			method: 'GET',
			path: '/oauthProvider/getAll',
			description:
				'List OAuth-capable local providers and detect whether their CLI credentials are already connected.'
		}
	})
	.query(async () => {
		const codex_probe = await probeCodexAuthState().catch(async () => ({
			auth_state: await readCodexAuthState(),
			connected: false
		}))
		const { auth_state: codex_auth, connected: codex_connected } = codex_probe
		const codex_installed = (await isToolInstalled('codex')) || Boolean(codex_auth)
		const opencode_installed = await isToolInstalled('opencode')
		const opencode_status = opencode_installed ? await runShellCommand('opencode providers list', 10000) : null
		const codex_label =
			codex_auth?.auth_mode === 'chatgpt' ? 'ChatGPT Plus/Pro' : codex_auth?.auth_mode || 'Codex'
		const opencode_credentials = (
			opencode_status
				? parseOpenCodeCredentials(`${opencode_status.stdout}\n${opencode_status.stderr}`)
				: []
		) as Array<{ name: string; method: string }>

		const providers = oauth_providers.map(item => {
			const item_credential_name = item.credential_name ?? item.name
			const synced_provider = getSyncedProvider({
				config: provider_config,
				definition: item
			})
			const effective_state = getEffectiveState({
				config: app_config,
				id: item.id,
				synced_provider: synced_provider ?? null
			})
			const current_models = effective_state?.models ?? synced_provider?.models ?? []
			const detected_models = effective_state?.detected_models ?? synced_provider?.models ?? []
			const synced = Boolean(synced_provider)
			const synced_model_count = current_models.length
			const synced_provider_name = synced_provider?.name ?? item.sync_provider_name ?? item.name

			if (item.client === 'codex') {
				return {
					...item,
					installed: codex_installed,
					connected: codex_connected,
					credential_label: codex_label,
					synced,
					editable: synced,
					enabled: effective_state?.enabled ?? synced_provider?.enabled ?? true,
					models: current_models,
					detected_model_count: detected_models.length,
					has_custom_models: hasCustomizedModels(effective_state),
					synced_model_count,
					synced_provider_name,
					synced_models: current_models.slice(0, 8).map(model => model.id)
				}
			}

			const matched_credential = opencode_credentials.find(
				credential => credential.name === item_credential_name
			)

			return {
				...item,
				installed: opencode_installed,
				connected: Boolean(matched_credential),
				credential_label: matched_credential?.name ?? null,
				synced,
				editable: synced,
				enabled: effective_state?.enabled ?? synced_provider?.enabled ?? true,
				models: current_models,
				detected_model_count: detected_models.length,
				has_custom_models: hasCustomizedModels(effective_state),
				synced_model_count,
				synced_provider_name,
				synced_models: current_models.slice(0, 8).map(model => model.id)
			}
		})

		return { providers }
	})
