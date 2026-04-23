import { to } from 'await-to-js'
import fs from 'fs-extra'

import type Index from '../index'

export default async (s: Index) => {
	const [err, res] = await to(fs.readJSON(s.config_dir))

	if (!err && res && typeof res === 'object') {
		const disable_map = (res as { disable_map?: unknown }).disable_map

		if (Array.isArray(disable_map)) {
			return {
				disable_map: disable_map.filter(value => typeof value === 'string') as Array<string>
			}
		}
	}

	return { disable_map: [] as Array<string> }
}
