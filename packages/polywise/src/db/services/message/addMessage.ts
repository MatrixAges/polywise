import { message } from '@core/db/schema'
import { env } from '@core/env'

import type { MessageInsert } from '@core/db'

export default async (values: MessageInsert) => {
	const [res] = await env.db.insert(message).values(values).returning()

	return res
}
