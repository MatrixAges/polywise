import fs from 'fs-extra'

import getConfig from './getConfig'
import { normalizeSessionRuntimeConfig } from './shared'

import type Index from '../index'

export default async (s: Index, patch: Partial<Awaited<ReturnType<typeof getConfig>>>) => {
	const current = await getConfig(s)
	const next = normalizeSessionRuntimeConfig({ ...current, ...patch })

	await fs.writeJSON(s.config_dir, next, { spaces: 4 })
	await s.updateConfig(next)

	return next
}
