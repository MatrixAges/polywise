import { node } from '@core/db/schema'
import { env } from '@core/env'

import type { NodeInsert } from '@core/db'

export default async (values: NodeInsert) => {
	const [res] = await env.db.insert(node).values(values).returning()

	return res
}
