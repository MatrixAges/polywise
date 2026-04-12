import { task } from '@core/db/schema'
import { env } from '@core/env'
import { SQL } from 'drizzle-orm'

import type { TaskInsert } from '@core/db'

export default async (where: SQL, values: Partial<TaskInsert>) => {
	const res = await env.db.update(task).set(values).where(where).returning()

	return res
}
