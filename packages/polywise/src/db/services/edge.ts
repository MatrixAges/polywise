import { edge } from '@core/db/schema'
import { env } from '@core/env'
import { SQL } from 'drizzle-orm'

import type { EdgeInsert } from '@core/db'

export const addEdge = async (values: EdgeInsert) => {
	return env.db
		.insert(edge)
		.values(values)
		.returning()
		.then(res => res[0])
}

export const getEdge = async (where?: SQL) => {
	return env.db
		.select()
		.from(edge)
		.where(where)
		.limit(1)
		.then(res => res[0])
}
