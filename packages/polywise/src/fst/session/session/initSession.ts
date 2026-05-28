import { session } from '@core/db/schema'
import { addSession, getSession } from '@core/db/services'
import dayjs from 'dayjs'
import { eq } from 'drizzle-orm'
import fs from 'fs-extra'

import { default_session_runtime_config } from '../config/shared'

import type Index from '../index'

export default async (s: Index, is_cron?: boolean, title?: string) => {
	let res: typeof s.session

	await fs.ensureDir(s.session_dir)
	await fs.ensureDir(s.files_dir)
	const session_config_exists = await fs.pathExists(s.config_dir)

	if (!session_config_exists) {
		await fs.writeJSON(s.config_dir, default_session_runtime_config, { spaces: 4 })
	}

	await s.updateConfig()

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
	s.running_since = res.running_since
}
