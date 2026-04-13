import { config, providers } from '@core/config'
import { getModel } from '@core/fst/provider'
import { pick } from 'es-toolkit'

import type { SpecialProvider } from '@core/types'

export default async (type: 'triple' | 'rewrite') => {
	const target_config = (type === 'triple' ? config.triple_model : config.rewrite_model) ?? config.default_model
	const { provider, model } = target_config

	const custom_list = providers.custom_providers ?? []
	const found_provider = [...providers.providers, ...custom_list].find(item => item.name === provider)

	const target_options = found_provider
		? {
				...pick(found_provider, ['apiKey', 'baseURL']),
				...(found_provider as SpecialProvider).custom_fields
			}
		: undefined

	const provider_name = custom_list.some(item => item.name === provider) ? 'open_responses' : provider

	return getModel({
		provider: provider_name,
		model,
		options: target_options,
		model_tool: false
	})
}
