import path from 'path'
import dayjs from 'dayjs'
import fs from 'fs-extra'

import type { PatchRecord } from './types'

export default async (args: { app_path: string; records: Array<PatchRecord>; date?: string }) => {
	const date = args.date || dayjs().format('YYYY-MM-DD')
	const patch_dir = path.resolve(args.app_path, 'patch')
	const patch_path = path.resolve(patch_dir, `${date}.json`)

	await fs.ensureDir(patch_dir)
	await fs.writeJson(patch_path, args.records, { spaces: 4 })

	return patch_path
}
