export const oauth_provider_ids = ['codex', 'opencode-go', 'opencode-zen'] as const

export type OAuthProviderId = (typeof oauth_provider_ids)[number]

export interface OAuthProviderDefinition {
	id: OAuthProviderId
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
