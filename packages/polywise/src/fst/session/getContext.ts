import { to } from 'await-to-js'
import fs from 'fs-extra'

import type Index from './index'

export default async (s: Index) => {
	const [err, res] = await to(fs.readJSON(s.context_dir))

	if (!err && res) {
		s.context = res
	}

	await s.getTasks()
}
