import { edge } from '@core/db/schema'
import { env } from '@core/env'

import type { EdgeInsert } from '@core/db'

export default async (values: EdgeInsert) => {
	const [res] = await env.db.insert(edge).values(values).returning()

	return res
}
