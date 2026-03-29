import { resolve } from 'path'
import { app } from '@core/consts'
import { preset_providers } from '@core/consts/providers'
import { ensureWithValue } from '@core/utils'

import type { AppConfig, ProviderConfig } from '@core/types'

const configs = ['config', 'providers']

export default async () => {
	for await (const name of configs) {
		const path = resolve(`${app.app_path}/${name}.json`)

		if (name === 'config') {
			const preset = preset_providers[0]
			const default_model = { provider: preset.name, model: preset.models[0].id }

			await ensureWithValue(path, {
				workspaces: [{ name: 'Default' }],
				current_workspace: 'Default',
				default_model,
				enable_triple: false,
				triple_model: default_model,
				enable_rewrite: false,
				rewrite_model: default_model
			} as AppConfig)
		}

		if (name === 'providers') {
			await ensureWithValue(path, { providers: preset_providers } as ProviderConfig)
		}
	}
}
