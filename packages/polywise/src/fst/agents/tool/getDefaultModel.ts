import { config, providers } from '@core/config'
import { getModel } from '@core/fst/provider'
import { pick } from 'es-toolkit'

import getProviderRuntimeName from '../../../utils/getProviderRuntimeName'

import type { SpecialProvider } from '@core/types'
import type { LanguageModel } from 'ai'

export default async (): Promise<LanguageModel> => {
	const { provider, model, effort } = config.default_model
	const custom_providers = providers.custom_providers ?? []
	const managed_providers = providers.managed_providers ?? []
	const all_providers = [...providers.providers, ...custom_providers, ...managed_providers]
	const target_provider = all_providers.find(item => item.name === provider)
	const target_options = target_provider
		? {
				...pick(target_provider, ['apiKey', 'baseURL']),
				...(target_provider as SpecialProvider).custom_fields
			}
		: undefined
	const target_provider_name = getProviderRuntimeName({
		provider_name: provider,
		provider_item: target_provider,
		custom_provider_names: custom_providers.map(item => item.name)
	})

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
