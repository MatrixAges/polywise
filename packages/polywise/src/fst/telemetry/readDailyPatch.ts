import path from 'path'
import dayjs from 'dayjs'
import fs from 'fs-extra'

import type { PatchRecord } from './types'

export default async (args: { app_path: string; date?: string }) => {
	const date = args.date || dayjs().format('YYYY-MM-DD')
	const patch_path = path.resolve(args.app_path, 'patch', `${date}.json`)

	if (!(await fs.pathExists(patch_path))) {
		return [] as Array<PatchRecord>
	}

	const content = await fs.readJson(patch_path, { throws: false })

	return Array.isArray(content) ? (content as Array<PatchRecord>) : []
}
