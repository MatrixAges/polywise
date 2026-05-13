import { agent, group_agent } from '@core/db/schema'
import { env } from '@core/env'
import { asc, eq, SQL } from 'drizzle-orm'

interface ArgsGetGroupAgents {
	where?: SQL
	orderBy?: SQL | Array<SQL>
}

export const addGroupAgent = async (group_id: string, agent_id: string, order: number) => {
	return env.db
		.insert(group_agent)
		.values({ group_id, agent_id, order })
		.returning()
		.then(res => res[0])
}

export const getGroupAgent = async (where: SQL) => {
	return env.db
		.select()
		.from(group_agent)
		.where(where)
		.limit(1)
		.then(res => res[0])
}

export const getGroupAgents = async (args: ArgsGetGroupAgents = {}) => {
	const { where, orderBy = [asc(group_agent.order), asc(group_agent.created_at)] } = args

	let query = env.db
		.select({ agent, group_agent })
		.from(group_agent)
		.innerJoin(agent, eq(group_agent.agent_id, agent.id))
		.$dynamic()

	if (where) query = query.where(where)

	if (orderBy) {
		const order_args = Array.isArray(orderBy) ? orderBy : [orderBy]

		query = query.orderBy(...order_args)
	}

	return query
}

export const setGroupAgent = async (where: SQL, values: Partial<{ order: number }>) => {
	return env.db
		.update(group_agent)
		.set(values)
		.where(where)
		.returning()
		.then(res => res[0])
}

export const removeGroupAgent = async (where: SQL) => {
	return env.db
		.delete(group_agent)
		.where(where)
		.returning()
		.then(res => res[0])
}
