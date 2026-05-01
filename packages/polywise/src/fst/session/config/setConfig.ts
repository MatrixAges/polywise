import fs from 'fs-extra'

import getConfig from './getConfig'

import type Index from '../index'
import type { SessionMode } from './getConfig'

export default async (s: Index, patch: Partial<{ disable_map: Array<string>; mode: SessionMode }>) => {
	const current = await getConfig(s)
	const next = { ...current, ...patch }

	await fs.writeJSON(s.config_dir, next, { spaces: 4 })

	if (patch.mode) s.mode = patch.mode

	return next
}
