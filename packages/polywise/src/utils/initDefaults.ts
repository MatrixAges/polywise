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

			await ensureWithValue(path, {
				provider: { id: preset.name, model: preset.models[0].id, effort: 'default' }
			} as AppConfig)
		}

		if (name === 'providers') {
			await ensureWithValue(path, { providers: preset_providers } as ProviderConfig)
		}
	}
}
