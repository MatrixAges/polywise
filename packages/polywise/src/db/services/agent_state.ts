import { agent, edge, node } from '@core/db/schema'
import { env } from '@core/env'
import { eq, inArray } from 'drizzle-orm'

const frozen_behavior_error = 'Frozen agents cannot change behavior-driving state.'
const frozen_knowledge_error = 'Frozen agents cannot change owned knowledge.'

export const getAgentOrThrow = async (agent_id: string) => {
	const target_agent = await env.db
		.select()
		.from(agent)
		.where(eq(agent.id, agent_id))
		.limit(1)
		.then(rows => rows[0])

	if (!target_agent) {
		throw new Error(`Agent not found: ${agent_id}`)
	}

	return target_agent
}

export const assertAgentWritableForBehavior = async (agent_id: string) => {
	const target_agent = await getAgentOrThrow(agent_id)

	if (target_agent.is_frozen) {
		throw new Error(frozen_behavior_error)
	}

	return target_agent
}

export const assertAgentWritableForKnowledge = async (agent_id: string) => {
	const target_agent = await getAgentOrThrow(agent_id)

	if (target_agent.is_frozen) {
		throw new Error(frozen_knowledge_error)
	}

	return target_agent
}

export const assertAgentsWritableForBehavior = async (agent_ids: Array<string>) => {
	const normalized_ids = Array.from(new Set(agent_ids.map(item => item.trim()).filter(Boolean)))

	if (normalized_ids.length === 0) {
		return [] as Array<Awaited<ReturnType<typeof getAgentOrThrow>>>
	}

	const rows = await env.db.select().from(agent).where(inArray(agent.id, normalized_ids))
	const row_map = new Map(rows.map(item => [item.id, item]))

	for (const agent_id of normalized_ids) {
		const target_agent = row_map.get(agent_id)

		if (!target_agent) {
			throw new Error(`Agent not found: ${agent_id}`)
		}

		if (target_agent.is_frozen) {
			throw new Error(frozen_behavior_error)
		}
	}

	return normalized_ids.map(agent_id => row_map.get(agent_id)!)
}

export const assertAgentsWritableForKnowledge = async (agent_ids: Array<string>) => {
	const normalized_ids = Array.from(new Set(agent_ids.map(item => item.trim()).filter(Boolean)))

	if (normalized_ids.length === 0) {
		return [] as Array<Awaited<ReturnType<typeof getAgentOrThrow>>>
	}

	const rows = await env.db.select().from(agent).where(inArray(agent.id, normalized_ids))
	const row_map = new Map(rows.map(item => [item.id, item]))

	for (const agent_id of normalized_ids) {
		const target_agent = row_map.get(agent_id)

		if (!target_agent) {
			throw new Error(`Agent not found: ${agent_id}`)
		}

		if (target_agent.is_frozen) {
			throw new Error(frozen_knowledge_error)
		}
	}

	return normalized_ids.map(agent_id => row_map.get(agent_id)!)
}

export const setAgentFrozenState = async (agent_id: string, is_frozen: boolean) => {
	await getAgentOrThrow(agent_id)

	env.db.transaction(tx => {
		tx.update(agent).set({ is_frozen }).where(eq(agent.id, agent_id)).run()
		tx.update(node).set({ is_frozen }).where(eq(node.agent_id, agent_id)).run()
		tx.update(edge).set({ is_frozen }).where(eq(edge.agent_id, agent_id)).run()
	})

	return getAgentOrThrow(agent_id)
}

export const frozen_agent_behavior_error = frozen_behavior_error
export const frozen_agent_knowledge_error = frozen_knowledge_error
