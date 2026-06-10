import { codex_base_url, codex_dummy_api_key } from './constants'
import getCodexOauthModels from './getCodexOauthModels'
import probeCodexAuthState from './probeCodexAuthState'
import openai_oauth_provider from './provider'

import type { Provider } from '@core/types'

export default async () => {
	const { auth_state: codex_auth, connected: codex_connected } = await probeCodexAuthState()

	if (!codex_auth || !codex_connected) {
		throw new Error('Codex ChatGPT login is missing or expired. Run `codex login` again first.')
	}

	const models = getCodexOauthModels()
	const provider = {
		name: openai_oauth_provider.sync_provider_name!,
		apiKey: codex_dummy_api_key,
		baseURL: codex_base_url,
		enabled: true,
		models,
		custom_fields: {
			provider_runtime: 'codex_oauth',
			auth_mode: codex_auth.auth_mode || 'chatgpt',
			oauth_provider_id: openai_oauth_provider.id
		}
	} as Provider

	return {
		provider,
		models
	}
}
