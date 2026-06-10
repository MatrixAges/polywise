import type { OAuthProviderDefinition } from '../types'

export const openai_oauth_provider = {
	id: 'codex',
	name: 'Codex',
	credential_name: 'Codex',
	client: 'codex',
	description:
		'Connect Codex through the local ChatGPT Plus/Pro OAuth state managed by the Codex CLI, then call the Codex API through the OpenAI Responses runtime.',
	detect: 'codex',
	connect_command: 'codex login --device-auth',
	docs_url: 'https://github.com/openai/codex',
	sync_supported: true,
	sync_provider_name: 'Codex'
} satisfies OAuthProviderDefinition

export default openai_oauth_provider
