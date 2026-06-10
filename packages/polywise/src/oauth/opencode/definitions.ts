import type { OAuthProviderDefinition } from '../types'

export const opencode_oauth_providers = [
	{
		id: 'opencode-go',
		name: 'OpenCode Go',
		credential_name: 'OpenCode Go',
		client: 'opencode',
		description: 'Connect the OpenCode Go OAuth provider through the local OpenCode CLI.',
		detect: 'opencode',
		connect_command: 'opencode providers login https://opencode.ai/go',
		docs_url: 'https://opencode.ai/docs/',
		sync_supported: true,
		sync_provider_name: 'OpenCode Go',
		sync_auth_key: 'opencode-go',
		sync_base_url: 'https://opencode.ai/zen/go/v1',
		sync_models_command: 'opencode models opencode-go'
	},
	{
		id: 'opencode-zen',
		name: 'OpenCode Zen',
		credential_name: 'OpenCode Zen',
		client: 'opencode',
		description: 'Connect the OpenCode Zen OAuth provider through the local OpenCode CLI.',
		detect: 'opencode',
		connect_command: 'opencode providers login https://opencode.ai/zen',
		docs_url: 'https://opencode.ai/docs/',
		sync_supported: true,
		sync_provider_name: 'OpenCode Zen',
		sync_auth_key: 'opencode',
		sync_base_url: 'https://opencode.ai/zen/v1',
		sync_models_command: 'opencode models opencode'
	}
] satisfies Array<OAuthProviderDefinition>

export default opencode_oauth_providers
