import { to } from 'await-to-js'
import dayjs from 'dayjs'
import fs from 'fs-extra'

import type { Context } from '../../types'
import type Index from '../index'

const append_context_history = async (s: Index, context: Context) => {
	const history_dir = s.context_history_dir
	await fs.ensureDir(history_dir)

	const file_name = `${dayjs().format('YYYY-MM-DD')}.jsonl`
	const file_path = `${history_dir}/${file_name}`

	await fs.appendFile(file_path, JSON.stringify(context) + '\n')
}

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

	append_context_history(s, s.context)

	return s.context
}
