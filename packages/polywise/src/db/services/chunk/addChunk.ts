import { chunk } from '@core/db/schema'
import { env } from '@core/env'

import type { ChunkInsert } from '@core/db'

export default async (values: ChunkInsert) => {
	const [res] = await env.db.insert(chunk).values(values).returning()

	return res
}
