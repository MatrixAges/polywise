import { session } from '@core/db/schema'
import { env } from '@core/env'
import { SQL } from 'drizzle-orm'

import type { SessionInsert } from '@core/db'

export const addSession = async (values: SessionInsert) => {
	return env.db
		.insert(session)
		.values(values)
		.returning()
		.then(res => res[0])
}

export const getSession = async (where: SQL) => {
	return env.db
		.select()
		.from(session)
		.where(where)
		.limit(1)
		.then(res => res[0])
}

export const setSession = async (where: SQL, values: Partial<SessionInsert>) => {
	return env.db
		.update(session)
		.set(values)
		.where(where)
		.returning()
		.then(res => res[0])
}
