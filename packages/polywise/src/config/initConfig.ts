import Watchpack from 'watchpack'

import { config_path } from '../consts/app'
import loadConfig from './loadConfig'

export default async () => {
	const watcher = new Watchpack({})

	watcher.watch({ files: [config_path] })

	watcher.on('change', async () => {
		await loadConfig()
	})

	await loadConfig()

	return watcher
}
