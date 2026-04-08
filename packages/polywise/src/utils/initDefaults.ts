import path from 'path'
import { app } from '@core/consts'
import { preset_providers } from '@core/consts/providers'
import { ensureWithValue } from '@core/utils'
import fs from 'fs-extra'

import { cron_path } from '../consts/app'

import type { AppConfig, ProviderConfig } from '@core/types'

const configs = ['config', 'providers']

export default async () => {
	for await (const name of configs) {
		const config_path = path.resolve(`${app.app_path}/${name}.json`)

		if (name === 'config') {
			const preset = preset_providers[0]
			const default_model = { provider: preset.name, model: preset.models[0].id }

			await ensureWithValue(config_path, {
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
			await ensureWithValue(config_path, { providers: preset_providers } as ProviderConfig)
		}
	}

	const skills_dir = path.resolve(app.app_path, 'skills')
	const cron_logs_dir = path.resolve(app.app_path, '.logs/cron')

	await fs.ensureDir(skills_dir)
	await fs.ensureDir(cron_logs_dir)

	await ensureWithValue(cron_path, {
		version: 1,
		tasks: []
	})
}
