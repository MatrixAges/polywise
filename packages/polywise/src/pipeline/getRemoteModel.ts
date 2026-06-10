import { config, providers } from '@core/config'
import { getModel } from '@core/fst/provider'
import { pick } from 'es-toolkit'

import getProviderRuntimeName from '../utils/getProviderRuntimeName'

import type { SpecialProvider } from '@core/types'

const local_providers = new Set(['local model', 'ollama', 'lmstudio'])

export const isRemoteProvider = (provider: string) => {
	return !local_providers.has(provider)
}

export default async (type: 'triple' | 'rewrite') => {
	const target_config = (type === 'triple' ? config.triple_model : config.rewrite_model) ?? config.default_model
	const { provider, model } = target_config

	const custom_list = providers.custom_providers ?? []
	const managed_list = providers.managed_providers ?? []
	const found_provider = [...providers.providers, ...custom_list, ...managed_list].find(
		item => item.name === provider
	)

	const target_options = found_provider
		? {
				...pick(found_provider, ['apiKey', 'baseURL']),
				...(found_provider as SpecialProvider).custom_fields
			}
		: undefined

	const provider_name = getProviderRuntimeName({
		provider_name: provider,
		provider_item: found_provider,
		custom_provider_names: custom_list.map(item => item.name)
	})

	return getModel({
		provider: provider_name,
		model,
		options: target_options,
		model_tool: false
	})
}
