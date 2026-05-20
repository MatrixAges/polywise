import { im_account } from '@core/db/schema'
import { env } from '@core/env'
import { SQL } from 'drizzle-orm'

import type { ImAccountInsert } from '@core/db'

export const addImAccount = async (values: ImAccountInsert) => {
	return env.db
		.insert(im_account)
		.values(values)
		.returning()
		.then(res => res[0])
}

export const getImAccount = async (where: SQL) => {
	return env.db
		.select()
		.from(im_account)
		.where(where)
		.limit(1)
		.then(res => res[0])
}

interface ArgsGetImAccounts {
	where?: SQL
	orderBy?: SQL | Array<SQL>
	limit?: number
	offset?: number
}

export const getImAccounts = async (args: ArgsGetImAccounts = {}) => {
	const { where, orderBy, limit, offset } = args

	let query = env.db.select().from(im_account).$dynamic()

	if (where) query = query.where(where)

	if (orderBy) {
		const order_args = Array.isArray(orderBy) ? orderBy : [orderBy]
		query = query.orderBy(...order_args)
	}

	if (limit) query = query.limit(limit)
	if (offset) query = query.offset(offset)

	return query
}

export const setImAccount = async (where: SQL, values: Partial<ImAccountInsert>) => {
	return env.db
		.update(im_account)
		.set(values)
		.where(where)
		.returning()
		.then(res => res[0])
}

export const removeImAccount = async (where: SQL) => {
	return env.db
		.delete(im_account)
		.where(where)
		.returning()
		.then(res => res[0])
}
