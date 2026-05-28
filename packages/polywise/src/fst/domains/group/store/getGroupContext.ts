import { to } from 'await-to-js'
import fs from 'fs-extra'

import type Session from '../../../session'
import type { GroupContext } from '../types'

export default async (s: Session) => {
	const [err, res] = await to(fs.readJSON(s.context_dir))

	if (!err && res && typeof res === 'object') {
		s.context = res as GroupContext
	}

	s.context = {
		...s.context,
		group_name: s.group!.name,
		group_description: s.group!.description ?? undefined
	} as GroupContext

	await s.getTasks()
}
