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
		description: agent.description ?? null
	}))
}
