import { session } from '@core/db/schema'
import { addSession, getSession } from '@core/db/services'
import dayjs from 'dayjs'
import { eq } from 'drizzle-orm'
import fs from 'fs-extra'

import type Index from '../index'

export default async (s: Index, is_cron?: boolean, title?: string) => {
	let res: typeof s.session

	await fs.ensureDir(s.session_dir)
	await fs.ensureDir(s.files_dir)
	await fs.ensureFile(s.config_dir)

	const session_config_exists = await fs.pathExists(s.config_dir)

	if (!session_config_exists) {
		await fs.writeJSON(s.config_dir, { disable_map: [], mode: 'normal' }, { spaces: 4 })
	}

	await s.getContext()
	await s.getState()

	const res_exsit = await getSession(eq(session.id, s.id))

	if (res_exsit) {
		res = res_exsit
	} else {
		const res_insert = await addSession({
			id: s.id,
			title: title || `Session ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`,
			is_cron: is_cron || undefined
		})

		res = res_insert
	}

	s.session = res
}
