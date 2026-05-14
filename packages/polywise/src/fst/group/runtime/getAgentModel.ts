import { config, providers } from '@core/config'
import { pick } from 'es-toolkit'

import { getModel } from '../../provider'

import type { Agent } from '@core/db'
import type { SpecialProvider } from '@core/types'

export default async (agent: Agent, args?: { omit_effort?: boolean }) => {
	const model_config = agent.model || config.default_model
	const { provider, model, effort } = model_config
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
		target_provider_name = 'open_compatible'
	}

	return getModel({
		provider: target_provider_name,
		model,
		effort: args?.omit_effort ? undefined : effort,
		options: target_options
	})
}
