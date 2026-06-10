import { config, providers } from '@core/config'
import { getModel } from '@core/fst/provider'
import { pick } from 'es-toolkit'

import getProviderRuntimeName from '../utils/getProviderRuntimeName'
import { isRemoteProvider } from './getRemoteModel'

import type { SpecialProvider } from '@core/types'

export default async () => {
	if (!config.embedding_model) return null

	const { provider, model } = config.embedding_model

	if (!isRemoteProvider(provider)) return null

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
		type: 'embedding',
		options: target_options
	})
}
