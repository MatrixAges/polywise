import { config, providers } from '@core/config'
import { getModel } from '@core/fst/provider'
import { pick } from 'es-toolkit'

import type { SpecialProvider } from '@core/types'

export default async () => {
	if (!config.rerank_model) return null

	const { provider, model } = config.rerank_model

	const custom_list = providers.custom_providers ?? []
	const found_provider = [...providers.providers, ...custom_list].find(item => item.name === provider)

	const target_options = found_provider
		? {
				...pick(found_provider, ['apiKey', 'baseURL']),
				...(found_provider as SpecialProvider).custom_fields
			}
		: undefined

	const provider_name = custom_list.some(item => item.name === provider) ? 'open_compatible' : provider

	return getModel({
		provider: provider_name,
		model,
		type: 'rerank',
		options: target_options
	})
}
