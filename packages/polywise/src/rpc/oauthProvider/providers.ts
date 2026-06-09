export interface OAuthProviderDefinition {
	id: string
	name: string
	credential_name?: string
	client: 'codex' | 'opencode'
	description: string
	detect: string
	connect_command: string
	docs_url: string
	sync_supported?: boolean
	sync_provider_name?: string
	sync_auth_key?: string
	sync_base_url?: string
	sync_models_command?: string
}

export const oauth_providers = [
	{
		id: 'codex',
		name: 'Codex',
		client: 'codex',
		description:
			'Connect Codex through the shared local ~/.codex authentication state used by the CLI and desktop app.',
		detect: 'codex',
		connect_command: 'codex login --device-auth',
		docs_url: 'https://github.com/openai/codex'
	},
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

export type OAuthProviderId = (typeof oauth_providers)[number]['id']
