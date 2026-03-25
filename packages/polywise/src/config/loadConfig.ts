import { clearObject, initDefaults, log } from '@core/utils'
import { to } from 'await-to-js'
import fs from 'fs-extra'

import { config_path, providers_path } from '../consts/app'
import { config, providers } from './index'

export default async () => {
	const [err_config, res_config] = await to(fs.readJson(config_path))
	const [err_providers, res_providers] = await to(fs.readJson(providers_path, { throws: false }))

	if (err_config || err_providers) return initDefaults()

	clearObject(config)
	Object.assign(config, res_config || {})

	clearObject(providers)
	Object.assign(providers, res_providers || {})

	log('CONFIG', 'load Config', () => res_config)
	log('CONFIG', 'load Providers', () => res_providers)
}
