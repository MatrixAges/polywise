import { session } from '@core/db/schema'
import { env } from '@core/env'
import dayjs from 'dayjs'
import { eq } from 'drizzle-orm'
import fs from 'fs-extra'

import type Index from '../index'

export default async (s: Index, is_cron?: boolean) => {
	let res: typeof s.session

	await fs.ensureDir(s.session_dir)
	await fs.ensureDir(s.files_dir)

	await s.getContext()

	const [res_exsit] = await env.db.select().from(session).where(eq(session.id, s.id)).limit(1)

	if (res_exsit) {
		res = res_exsit
	} else {
		const [res_insert] = await env.db
			.insert(session)
			.values({
				id: s.id,
				title: `Session ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`,
				is_cron: is_cron || undefined
			})
			.returning()

		res = res_insert
	}

	s.session = res
}
