import { config as app_config, providers as provider_config } from '@core/config'
import { p } from '@core/utils'

import { getOpenAIOAuthProviderStatus } from '../../oauth/openai'
import { getOpenCodeConnectionState, getOpenCodeOAuthProviderStatus } from '../../oauth/opencode'
import { oauth_providers } from '../../oauth/providers'

export default p
	.meta({
		openapi: {
			method: 'GET',
			path: '/oauth/getAll',
			description:
				'List OAuth-capable local providers and detect whether their CLI credentials are already connected.'
		}
	})
	.query(async () => {
		const opencode_connection_state = await getOpenCodeConnectionState()
		const providers = await Promise.all(
			oauth_providers.map(async item => {
				if (item.client === 'codex') {
					return await getOpenAIOAuthProviderStatus({
						app_config,
						provider_config
					})
				}

				return getOpenCodeOAuthProviderStatus({
					definition: item,
					app_config,
					provider_config,
					connection_state: opencode_connection_state
				})
			})
		)

		return { providers }
	})
