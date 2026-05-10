import { config, providers } from '@core/config'
import { getModel } from '@core/fst/provider'
import { pick } from 'es-toolkit'

import type { SpecialProvider } from '@core/types'
import type { LanguageModel } from 'ai'

export default async (): Promise<LanguageModel> => {
	const { provider, model, effort } = config.default_model
	const custom_providers = providers.custom_providers ?? []
	const all_providers = [...providers.providers, ...custom_providers]
	const target_provider = all_providers.find(item => item.name === provider)
	const target_options = target_provider
		? {
				...pick(target_provider, ['apiKey', 'baseURL']),
				...(target_provider as SpecialProvider).custom_fields
			}
		: undefined
	const target_provider_name = custom_providers.some(item => item.name === provider) ? 'open_compatible' : provider

	return (
		await getModel({
			provider: target_provider_name,
			model,
			effort,
			options: target_options,
			model_tool: false
		})
	).model
}
