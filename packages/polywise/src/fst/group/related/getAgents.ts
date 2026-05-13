import { group_agent } from '@core/db/schema'
import { getGroupAgents } from '@core/db/services'
import { eq } from 'drizzle-orm'

import type Group from '../index'

export default async (s: Group) => {
	const res = await getGroupAgents({
		where: eq(group_agent.group_id, s.group_id)
	})

	s.agents = res.map(item => item.agent)
	s.agents_map = s.agents.map(agent => ({
		id: agent.id,
		name: agent.name,
		role: agent.role,
		description: agent.description ?? null
	}))

	console.log('[group-debug][group.getAgents] loaded', {
		session_id: s.id,
		group_id: s.group_id,
		agent_count: s.agents.length,
		agent_ids: s.agents.map(agent => agent.id)
	})
}
