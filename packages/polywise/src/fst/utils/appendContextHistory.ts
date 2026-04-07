import dayjs from 'dayjs'
import fs from 'fs-extra'

import isContextEmpty from './isContextEmpty'

import type { Context } from '../types'

export default async (context_history_dir: string, context: Context) => {
	if (isContextEmpty(context)) {
		return
	}

	await fs.ensureDir(context_history_dir)

	const file_name = `${dayjs().format('YYYY-MM-DD')}.jsonl`
	const file_path = `${context_history_dir}/${file_name}`

	const history_entry = {
		...context,
		timestamp: dayjs().format('HH:mm:ss')
	}

	await fs.appendFile(file_path, JSON.stringify(history_entry) + '\n')
}
