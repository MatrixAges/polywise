import { to } from 'await-to-js'
import fs from 'fs-extra'

import type { Context } from '../types'
import type Index from './index'

export default async (s: Index, v: Partial<Context>) => {
	if (v.tasks) {
		await s.setTasks(v.tasks)
	}

	s.context = {
		...s.context,
		...v,
		total_messages_count: s.context.total_messages_count,
		current_messages_count: s.context.current_messages_count
	} as Context

	console.log(s.context)

	const [err] = await to(fs.writeJSON(s.context_dir, s.context, { spaces: 4 }))

	if (err) return

	return s.context
}
