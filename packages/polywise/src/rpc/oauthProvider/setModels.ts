import { config_path, providers_path } from '@core/consts/app'
import { p } from '@core/utils'
import { z } from 'zod'

import { oauth_providers } from './providers'
import { readProviderConfigFile } from './runtime'
import {
	getEffectiveState,
	getOAuthProviderDefinition,
	getSyncedProvider,
	readAppConfigFile,
	saveOAuthProviderState
} from './shared'

const model_type = z.enum(['text', 'embedding', 'rerank', 'image', 'audio', 'video'])
const input_type = z.object({
	id: z.enum(oauth_providers.map(item => item.id) as [string, ...Array<string>]),
	models: z.array(
		z.object({
			id: z.string().trim().min(1),
			name: z.string().trim().min(1),
			enabled: z.boolean(),
			type: model_type.optional(),
			fid: z.string().trim().optional()
		})
	)
})

const validateModels = (models: z.infer<typeof input_type>['models']) => {
	const model_id_set = new Set<string>()

	for (const model of models) {
		if (model_id_set.has(model.id)) {
			throw new Error(`Model "${model.id}" already exists.`)
		}

		model_id_set.add(model.id)
	}
}

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/oauthProvider/setModels',
			description: 'Replace the editable model list for one synced OAuth provider.'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		validateModels(input.models)

		const provider = getOAuthProviderDefinition(input.id)
		const current_app_config = await readAppConfigFile()
		const current_provider_config = await readProviderConfigFile(providers_path)
		const synced_provider = getSyncedProvider({
			config: current_provider_config,
			definition: provider
		})
		const effective_state = getEffectiveState({
			config: current_app_config,
			id: input.id,
			synced_provider
		})

		if (!effective_state || !synced_provider) {
			throw new Error(`${provider.name} has not been synced locally yet.`)
		}

		await saveOAuthProviderState({
			app_config: current_app_config,
			provider_config: current_provider_config,
			id: input.id,
			state: {
				...effective_state,
				models: input.models.map(model => ({ ...model }))
			},
			provider: synced_provider,
			config_path,
			providers_path
		})

		return {
			ok: true as const,
			provider: {
				id: provider.id,
				name: provider.name
			},
			model_count: input.models.length
		}
	})
