import { config, providers } from '@core/config'
import { getModel } from '@core/fst/provider'
import { pick } from 'es-toolkit'

import type { SpecialProvider } from '@core/types'

const LOCAL_PROVIDERS = new Set(['ollama', 'lmstudio'])

export const isRemoteProvider = (provider_name: string) => !LOCAL_PROVIDERS.has(provider_name)

export default async (type: 'triple' | 'rewrite') => {
	const { provider, model } = type === 'triple' ? config.triple_model : config.rewrite_model
	const custom_list = providers.custom_providers ?? []
	const all_providers = [...providers.providers, ...custom_list]
	const target_provider = all_providers.find(item => item.name === provider)

	const target_options = target_provider
		? {
				...pick(target_provider, ['apiKey', 'baseURL']),
				...(target_provider as SpecialProvider).custom_fields
			}
		: undefined

	const target_provider_name = custom_list.some(item => item.name === provider) ? 'open_responses' : provider

	return getModel({
		provider: target_provider_name,
		model,
		options: target_options,
		model_tool: false
	})
}
