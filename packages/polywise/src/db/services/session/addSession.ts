import { session } from '@core/db/schema'
import { env } from '@core/env'

import type { SessionInsert } from '@core/db'

export default async (values: SessionInsert) => {
	const [res] = await env.db.insert(session).values(values).returning()

	return res
}
