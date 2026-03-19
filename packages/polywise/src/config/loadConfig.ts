import to from 'await-to-js'
import fs from 'fs-extra'

import { config_path } from '../consts/app'
import { config, config_emitter } from './index'

export default async () => {
	const [err, data] = await to(fs.readJson(config_path, { throws: false }))

	if (err) {
		await fs.ensureFile(config_path)
		await fs.writeJson(config_path, {}, { spaces: 4 })

		return
	}

	Object.assign(config, data || {})

	config_emitter.emit('change', config)
}
