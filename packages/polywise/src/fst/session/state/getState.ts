import { to } from 'await-to-js'
import fs from 'fs-extra'

import type Index from '../index'

export default async (s: Index) => {
	const [err, res] = await to(fs.readJSON(s.state_dir))

	if (!err && res && typeof res === 'object') {
		const archived_at = (res as { archived_at?: unknown }).archived_at
		const running_since = (res as { running_since?: unknown }).running_since

		s.archived_at = typeof archived_at === 'number' ? archived_at : null
		s.running_since = typeof running_since === 'number' ? running_since : null
	}
}
