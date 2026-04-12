import { todo } from '@core/db/schema'
import { env } from '@core/env'

import type { TodoInsert } from '@core/db'

export default async (values: TodoInsert) => {
	const [res] = await env.db.insert(todo).values(values).returning()

	return res
}
