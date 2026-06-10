import { runShellCommand } from '../runtime'
import parseOpenCodeModels from './parseOpenCodeModels'
import readOpenCodeAuthFile from './readOpenCodeAuthFile'

import type { Provider } from '@core/types'
import type { OAuthProviderDefinition } from '../types'

export default async (args: { definition: OAuthProviderDefinition }) => {
	const { definition } = args

	if (!definition.sync_auth_key || !definition.sync_base_url || !definition.sync_models_command) {
		throw new Error(`${definition.name} does not support automatic model sync yet.`)
	}

	const auth_file = await readOpenCodeAuthFile()
	const auth_entry = auth_file?.[definition.sync_auth_key]
	const api_key = auth_entry?.key?.trim()

	if (!api_key) {
		throw new Error(`${definition.name} is not logged in locally yet.`)
	}

	const models_result = await runShellCommand(definition.sync_models_command, 15000)

	if (models_result.exitCode !== 0) {
		throw new Error(
			models_result.stderr.trim() ||
				models_result.stdout.trim() ||
				`Failed to list models for ${definition.name}.`
		)
	}

	const models = parseOpenCodeModels(models_result.stdout)

	if (models.length === 0) {
		throw new Error(`No models were returned for ${definition.name}.`)
	}

	const provider = {
		name: definition.sync_provider_name!,
		apiKey: api_key,
		baseURL: definition.sync_base_url,
		enabled: true,
		models,
		custom_fields: {
			provider_runtime: 'opencode_oauth',
			oauth_provider_id: definition.id
		}
	} as Provider

	return {
		provider,
		models
	}
}
