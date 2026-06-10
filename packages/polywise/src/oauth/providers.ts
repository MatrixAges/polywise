import { openai_oauth_provider } from './openai'
import { opencode_oauth_providers } from './opencode'

import type { OAuthProviderDefinition, OAuthProviderId } from './types'

export const oauth_providers = [
	openai_oauth_provider,
	...opencode_oauth_providers
] satisfies Array<OAuthProviderDefinition>

export const getOAuthProviderDefinition = (id: OAuthProviderId) => {
	const provider = oauth_providers.find(item => item.id === id)

	if (!provider) {
		throw new Error(`Unknown OAuth provider: ${id}`)
	}

	return provider
}

export default oauth_providers
