import { group } from '@core/db/schema'
import { env } from '@core/env'
import { SQL } from 'drizzle-orm'

import type { Group, GroupInsert } from '@core/db'

interface ArgsGetGroups {
	where?: SQL
	orderBy?: SQL | Array<SQL>
	limit?: number
	offset?: number
}

const normalizeGroup = (row: Group | undefined) => {
	if (!row) {
		return row
	}

	const base_row = {
		...row,
		folders: Array.isArray(row.folders) ? row.folders : []
	}
	const photo = row.photo

	if (!photo) {
		return base_row
	}

	if (photo instanceof Uint8Array && photo.constructor === Uint8Array) {
		return base_row
	}

	if (photo instanceof Uint8Array) {
		return { ...base_row, photo: new Uint8Array(photo) }
	}

	if (photo instanceof ArrayBuffer) {
		return { ...base_row, photo: new Uint8Array(photo) }
	}

	return base_row
}

export const addGroup = async (values: GroupInsert) => {
	return env.db
		.insert(group)
		.values(values)
		.returning()
		.then(res => normalizeGroup(res[0]))
}

export const getGroup = async (where: SQL) => {
	return env.db
		.select()
		.from(group)
		.where(where)
		.limit(1)
		.then(res => normalizeGroup(res[0]))
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

	return query.then(res => res.map(item => normalizeGroup(item) as Group))
}

export const setGroup = async (where: SQL, values: Partial<GroupInsert>) => {
	return env.db
		.update(group)
		.set(values)
		.where(where)
		.returning()
		.then(res => normalizeGroup(res[0]))
}

export const removeGroup = async (where: SQL) => {
	return env.db
		.delete(group)
		.where(where)
		.returning()
		.then(res => normalizeGroup(res[0]))
}
