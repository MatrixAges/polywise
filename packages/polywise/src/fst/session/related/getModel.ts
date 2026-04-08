import { config, providers } from '@core/config'
import { pick } from 'es-toolkit'

import { getModel } from '../../provider'

import type { SpecialProvider } from '@core/types'
import type Index from '../index'

export default async (s: Index) => {
	const { provider, model } = config.default_model
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

	let target_provider_name = provider

	if (custom_providers.find(item => item.name === provider)) {
		target_provider_name = 'open_responses'
	}

	s.model = await getModel(target_provider_name, model, target_options)
}
