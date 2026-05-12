import { group } from '@core/db/schema'
import { env } from '@core/env'
import { SQL } from 'drizzle-orm'

import type { GroupInsert } from '@core/db'

interface ArgsGetGroups {
	where?: SQL
	orderBy?: SQL | Array<SQL>
	limit?: number
	offset?: number
}

export const addGroup = async (values: GroupInsert) => {
	return env.db
		.insert(group)
		.values(values)
		.returning()
		.then(res => res[0])
}

export const getGroup = async (where: SQL) => {
	return env.db
		.select()
		.from(group)
		.where(where)
		.limit(1)
		.then(res => res[0])
}

export const getGroups = async (args: ArgsGetGroups = {}) => {
	const { where, orderBy, limit, offset } = args

	let query = env.db.select().from(group).$dynamic()

	if (where) query = query.where(where)

	if (orderBy) {
		const order_args = Array.isArray(orderBy) ? orderBy : [orderBy]

		query = query.orderBy(...order_args)
	}

	if (limit) query = query.limit(limit)
	if (offset) query = query.offset(offset)

	return query
}

export const setGroup = async (where: SQL, values: Partial<GroupInsert>) => {
	return env.db
		.update(group)
		.set(values)
		.where(where)
		.returning()
		.then(res => res[0])
}

export const removeGroup = async (where: SQL) => {
	return env.db
		.delete(group)
		.where(where)
		.returning()
		.then(res => res[0])
}
