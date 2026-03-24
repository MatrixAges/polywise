import Watchpack from 'watchpack'

import { config_path } from '../consts/app'
import loadConfig from './loadConfig'

export const config_watcher = new Watchpack({})

export default async () => {
	config_watcher.watch({ files: [config_path] })

	config_watcher.on('change', async () => {
		await loadConfig()
	})

	await loadConfig()
}
