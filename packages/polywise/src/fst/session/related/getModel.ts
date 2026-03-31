import { config, providers } from '@core/config'
import { pick } from 'es-toolkit'

import { getModel } from '../../provider'

import type { SpecialProvider } from '@core/types'
import type Index from '../index'

export default async (s: Index) => {
	const { provider, model } = config.default_model

	const all_providers = [...providers.providers, ...(providers.custom_providers || [])]
	const target_provider = all_providers.find(item => item.name === provider)

	let target_options

	if (target_provider) {
		target_options = {
			...pick(target_provider, ['apiKey', 'baseURL']),
			...(target_provider as SpecialProvider)['custom_fields']
		}
	}

	s.model = await getModel(provider, model, target_options)
}
