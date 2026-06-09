import { config, providers } from '@core/config'
import { pick } from 'es-toolkit'

import getProviderRuntimeName from '../../../utils/getProviderRuntimeName'
import { getModel } from '../../provider'

import type { SpecialProvider } from '@core/types'
import type Index from '../index'

export default async (s: Index) => {
	const { provider, model, effort } = config.default_model
	const custom_providers = providers.custom_providers || []

	const all_providers = [...providers.providers, ...custom_providers]
	const target_provider = all_providers.find(item => item.name === provider)

	let target_options

	if (target_provider) {
		target_options = {
			...pick(target_provider, ['apiKey', 'baseURL']),
			...(target_provider as SpecialProvider)['custom_fields']
		}
	}

	const target_provider_name = getProviderRuntimeName({
		provider_name: provider,
		provider_item: target_provider,
		custom_provider_names: custom_providers.map(item => item.name)
	})

	s.model = await getModel({ provider: target_provider_name, model, effort, options: target_options })
}
