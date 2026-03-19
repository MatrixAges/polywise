import Watchpack from 'watchpack'

import { config_path } from '../consts/app'
import loadConfig from './loadConfig'

const watcher = new Watchpack({})

watcher.watch({
	files: [config_path]
})

watcher.on('change', async () => {
	await loadConfig()
})
