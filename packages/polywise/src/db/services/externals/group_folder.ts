import { group_folder } from '@core/db/schema'
import { env } from '@core/env'
import { asc, SQL } from 'drizzle-orm'

interface ArgsGetGroupFolders {
	where?: SQL
	orderBy?: SQL | Array<SQL>
}

export const addGroupFolder = async (group_id: string, path: string, order: number) => {
	return env.db
		.insert(group_folder)
		.values({ group_id, path, order })
		.returning()
		.then(res => res[0])
}

export const getGroupFolder = async (where: SQL) => {
	return env.db
		.select()
		.from(group_folder)
		.where(where)
		.limit(1)
		.then(res => res[0])
}

export const getGroupFolders = async (args: ArgsGetGroupFolders = {}) => {
	const { where, orderBy = [asc(group_folder.order), asc(group_folder.created_at)] } = args

	let query = env.db.select().from(group_folder).$dynamic()

	if (where) query = query.where(where)

	if (orderBy) {
		const order_args = Array.isArray(orderBy) ? orderBy : [orderBy]

		query = query.orderBy(...order_args)
	}

	return query
}

export const setGroupFolder = async (where: SQL, values: Partial<{ order: number }>) => {
	return env.db
		.update(group_folder)
		.set(values)
		.where(where)
		.returning()
		.then(res => res[0])
}

export const removeGroupFolder = async (where: SQL) => {
	return env.db
		.delete(group_folder)
		.where(where)
		.returning()
		.then(res => res[0])
}
