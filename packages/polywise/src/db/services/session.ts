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

interface ArgsGetSessions {
	where?: SQL
	orderBy?: SQL | Array<SQL>
	limit?: number
	offset?: number
}

export const getSessions = async (args: ArgsGetSessions = {}) => {
	const { where, orderBy, limit, offset } = args

	let query = env.db.select().from(session).$dynamic()

	if (where) query = query.where(where)

	if (orderBy) {
		const order_args = Array.isArray(orderBy) ? orderBy : [orderBy]

		query = query.orderBy(...order_args)
	}

	if (limit) query = query.limit(limit)

	if (offset) query = query.offset(offset)

	return query
}

export const setSession = async (where: SQL, values: Partial<SessionInsert>) => {
	return env.db
		.update(session)
		.set(values)
		.where(where)
		.returning()
		.then(res => res[0])
}

export const removeSession = async (where: SQL) => {
	return env.db
		.delete(session)
		.where(where)
		.returning()
		.then(res => res[0])
}
