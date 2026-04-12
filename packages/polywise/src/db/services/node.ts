import { node } from '@core/db/schema'
import { env } from '@core/env'
import { SQL } from 'drizzle-orm'

import type { NodeInsert } from '@core/db'

export const addNode = async (values: NodeInsert) => {
	return env.db
		.insert(node)
		.values(values)
		.returning()
		.then(res => res[0])
}

export const getNode = async (where?: SQL) => {
	return env.db
		.select()
		.from(node)
		.where(where)
		.limit(1)
		.then(res => res[0])
}
