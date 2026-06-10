import { providers as provider_config } from '@core/config'
import { p } from '@core/utils'

import { probeCodexAuthState, readCodexAuthState } from '../../utils/codexOauth'
import { oauth_providers } from './providers'
import { isToolInstalled, parseOpenCodeCredentials, runShellCommand } from './runtime'

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
			const item_name = item.name
			const item_credential_name = item.credential_name ?? item_name
			const matched_provider = provider_config.custom_providers?.find(
				provider => provider.name === item.sync_provider_name
			)
			const codex_runtime =
				matched_provider && 'custom_fields' in matched_provider
					? ((matched_provider as { custom_fields?: { provider_runtime?: string } }).custom_fields
							?.provider_runtime ?? '')
					: ''
			const synced_provider =
				item.id === 'codex'
					? codex_runtime === 'codex_oauth'
						? matched_provider
						: undefined
					: matched_provider

			if (item.client === 'codex') {
				return {
					...item,
					installed: codex_installed,
					connected: codex_connected,
					credential_label: codex_label,
					synced: Boolean(synced_provider),
					synced_model_count: synced_provider?.models?.length ?? 0,
					synced_models: synced_provider?.models?.slice(0, 8).map(model => model.id) ?? []
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
				synced: Boolean(synced_provider),
				synced_model_count: synced_provider?.models?.length ?? 0,
				synced_models: synced_provider?.models?.slice(0, 8).map(model => model.id) ?? []
			}
		})

		return { providers }
	})
