import { agent } from '@core/db/schema'
import { env } from '@core/env'
import { asc, SQL } from 'drizzle-orm'

import type { AgentInsert } from '@core/db'

interface ArgsGetAgents {
	where?: SQL
	orderBy?: SQL | Array<SQL>
	limit?: number
}

export const addAgent = async (values: AgentInsert) => {
	return env.db
		.insert(agent)
		.values(values)
		.returning()
		.then(res => res[0])
}

export const getAgent = async (where: SQL) => {
	return env.db
		.select()
		.from(agent)
		.where(where)
		.limit(1)
		.then(res => res[0])
}

export const getAgents = async (args: ArgsGetAgents = {}) => {
	const { where, orderBy = [asc(agent.order), asc(agent.created_at)], limit } = args

	let query = env.db.select().from(agent).$dynamic()

	if (where) query = query.where(where)

	if (orderBy) {
		const order_args = Array.isArray(orderBy) ? orderBy : [orderBy]

		query = query.orderBy(...order_args)
	}

	if (limit) query = query.limit(limit)

	return query
}

export const setAgent = async (where: SQL, values: Partial<AgentInsert>) => {
	return env.db
		.update(agent)
		.set(values)
		.where(where)
		.returning()
		.then(res => res[0])
}

export const removeAgent = async (where: SQL) => {
	return env.db
		.delete(agent)
		.where(where)
		.returning()
		.then(res => res[0])
}
