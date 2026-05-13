import { agent, group_agent } from '@core/db/schema'
import { env } from '@core/env'
import { asc, eq, SQL } from 'drizzle-orm'

interface ArgsGetGroupAgents {
	where?: SQL
	orderBy?: SQL | Array<SQL>
}

export const addGroupAgent = async (group_id: string, agent_id: string, order: number) => {
	console.log('[group-debug][db.addGroupAgent] insert', {
		group_id,
		agent_id,
		order
	})

	const row = await env.db
		.insert(group_agent)
		.values({ group_id, agent_id, order })
		.returning()
		.then(res => res[0])

	console.log('[group-debug][db.addGroupAgent] inserted', {
		group_id: row?.group_id ?? group_id,
		agent_id: row?.agent_id ?? agent_id,
		order: row?.order ?? order
	})

	return row
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
	const raw_rows = where
		? await env.db.select().from(group_agent).where(where)
		: await env.db.select().from(group_agent)

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

	const joined_rows = await query

	console.log('[group-debug][db.getGroupAgents] result', {
		where: String(where ?? 'undefined'),
		raw_relation_count: raw_rows.length,
		raw_relations: raw_rows.map(item => ({
			group_id: item.group_id,
			agent_id: item.agent_id,
			order: item.order
		})),
		joined_count: joined_rows.length,
		joined_agent_ids: joined_rows.map(item => item.agent.id)
	})

	return joined_rows
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
