import { link } from '@core/db/schema'
import { env } from '@core/env'
import { desc, SQL } from 'drizzle-orm'

import type { Link, LinkInsert } from '@core/db'

interface ArgsGetLinks {
	where?: SQL
	orderBy?: SQL | Array<SQL>
	limit?: number
	offset?: number
}

const normalizeLink = (row: Link | undefined) => {
	if (!row) {
		return row
	}

	const favicon = row.favicon

	if (!favicon) {
		return row
	}

	if (favicon instanceof Uint8Array && favicon.constructor === Uint8Array) {
		return row
	}

	if (favicon instanceof Uint8Array) {
		return { ...row, favicon: new Uint8Array(favicon) }
	}

	if (favicon instanceof ArrayBuffer) {
		return { ...row, favicon: new Uint8Array(favicon) }
	}

	return row
}

export const addLink = async (values: LinkInsert) => {
	return env.db
		.insert(link)
		.values(values)
		.returning()
		.then(res => normalizeLink(res[0]))
}

export const getLink = async (where: SQL) => {
	return env.db
		.select()
		.from(link)
		.where(where)
		.limit(1)
		.then(res => normalizeLink(res[0]))
}

export const getLinks = async (args: ArgsGetLinks = {}) => {
	const { where, orderBy = [desc(link.updated_at), desc(link.created_at)], limit, offset } = args

	let query = env.db.select().from(link).$dynamic()

	if (where) query = query.where(where)

	if (orderBy) {
		const order_args = Array.isArray(orderBy) ? orderBy : [orderBy]

		query = query.orderBy(...order_args)
	}

	if (limit) query = query.limit(limit)
	if (offset) query = query.offset(offset)

	return query.then(res => res.map(item => normalizeLink(item) as Link))
}

export const setLink = async (where: SQL, values: Partial<LinkInsert>) => {
	return env.db
		.update(link)
		.set(values)
		.where(where)
		.returning()
		.then(res => normalizeLink(res[0]))
}

export const removeLink = async (where: SQL) => {
	return env.db
		.delete(link)
		.where(where)
		.returning()
		.then(res => normalizeLink(res[0]))
}
