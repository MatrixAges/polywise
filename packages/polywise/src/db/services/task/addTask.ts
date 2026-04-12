import { task } from '@core/db/schema'
import { env } from '@core/env'

import type { TaskInsert } from '@core/db'

export default async (values: TaskInsert) => {
	const [res] = await env.db.insert(task).values(values).returning()

	return res
}
