import { todo } from '@core/db/schema'
import { env } from '@core/env'
import { SQL } from 'drizzle-orm'

import type { TodoInsert } from '@core/db'

export default async (where: SQL, values: Partial<TodoInsert>) => {
	const res = await env.db.update(todo).set(values).where(where).returning()

	return res
}
