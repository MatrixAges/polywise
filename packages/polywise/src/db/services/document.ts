import { document } from '@core/db/schema'
import { env } from '@core/env'
import { SQL } from 'drizzle-orm'

import type { DocumentInsert } from '@core/db'

interface ArgsGetDocuments {
	where?: SQL
	orderBy?: SQL | Array<SQL>
	limit?: number
}

export const addDocument = async (values: DocumentInsert) => {
	return env.db
		.insert(document)
		.values(values)
		.returning()
		.then(res => res[0])
}

export const getDocument = async (where: SQL) => {
	return env.db
		.select()
		.from(document)
		.where(where)
		.limit(1)
		.then(res => res[0])
}

export const getDocuments = async (args: ArgsGetDocuments = {}) => {
	const { where, orderBy, limit } = args

	let query = env.db.select().from(document).$dynamic()

	if (where) query = query.where(where)

	if (orderBy) {
		const order_args = Array.isArray(orderBy) ? orderBy : [orderBy]

		query = query.orderBy(...order_args)
	}

	if (limit) query = query.limit(limit)

	return query
}

export const removeDocument = async (where: SQL) => {
	return env.db.delete(document).where(where).returning()
}

export const setDocument = async (where: SQL, values: Partial<DocumentInsert>) => {
	return env.db.update(document).set(values).where(where).returning()
}
