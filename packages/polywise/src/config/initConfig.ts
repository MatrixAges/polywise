import fs from 'fs-extra'
import Watchpack from 'watchpack'

import { config_path, providers_path } from '../consts/app'
import { config, providers } from './index'
import loadConfig from './loadConfig'

export const config_watcher = new Watchpack({})

export default async () => {
	config_watcher.watch({ files: [config_path, providers_path] })

	config_watcher.on('change', async () => {
		await loadConfig()
	})

	config_watcher.on('remove', async () => {
		await fs.writeFile(config_path, JSON.stringify(config, null, 4))
		await fs.writeFile(providers_path, JSON.stringify(providers, null, 4))
	})

	await loadConfig()
}
