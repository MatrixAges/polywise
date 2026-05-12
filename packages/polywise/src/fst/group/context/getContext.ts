import { to } from 'await-to-js'
import fs from 'fs-extra'

import type Group from '../index'
import type { GroupContext } from '../types'

export default async (s: Group) => {
	const [err, res] = await to(fs.readJSON(s.context_dir))

	if (!err && res && typeof res === 'object') {
		s.context = res as GroupContext
	}

	s.context = {
		...s.context,
		group_name: s.group.name,
		group_description: s.group.description ?? undefined
	} as GroupContext

	await s.getTasks()
}
