import { to } from 'await-to-js'
import fs from 'fs-extra'

import { default_session_runtime_config, normalizeSessionRuntimeConfig } from './shared'

import type Index from '../index'

export default async (s: Index) => {
	const [err, res] = await to(fs.readJSON(s.config_dir))

	if (!err && res && typeof res === 'object') {
		return normalizeSessionRuntimeConfig(res as any)
	}

	return default_session_runtime_config
}
