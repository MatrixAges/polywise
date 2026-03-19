import to from 'await-to-js'
import { deepmerge } from 'deepmerge-ts'
import fs from 'fs-extra'

import { config_path } from '../consts/app'

import type { Config } from './index'

export default async (new_config: Partial<Config>) => {
	const [err, current] = await to(fs.readJson(config_path, { throws: false }))

	if (err) {
		await fs.ensureFile(config_path)
	}

	const merged = deepmerge(current || {}, new_config)

	await fs.writeJson(config_path, merged, { spaces: 4 })
}
