import { config, providers } from '@core/config'
import { pick } from 'es-toolkit'

import { getModel } from '../../../provider'

import type { Agent } from '@core/db'
import type { SpecialProvider } from '@core/types'

export default async (agent: Agent, args?: { omit_effort?: boolean }) => {
	const modelConfig = agent.model || config.default_model
	const { provider, model, effort } = modelConfig
	const customProviders = providers.custom_providers || []
	const allProviders = [...providers.providers, ...customProviders]
	const targetProvider = allProviders.find(item => item.name === provider)

	let targetOptions

	if (targetProvider) {
		targetOptions = {
			...pick(targetProvider, ['apiKey', 'baseURL']),
			...(targetProvider as SpecialProvider)['custom_fields']
		}
	}

	let targetProviderName = provider

	if (customProviders.find(item => item.name === provider)) {
		targetProviderName = 'open_compatible'
	}

	return getModel({
		provider: targetProviderName,
		model,
		effort: args?.omit_effort ? undefined : effort,
		options: targetOptions
	})
}
