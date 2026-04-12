import { session_agent } from '@core/db/schema'
import { getSessionAgents } from '@core/db/services'
import { eq } from 'drizzle-orm'

import type Index from '../index'

export default async (s: Index) => {
	const res = await getSessionAgents({
		where: eq(session_agent.session_id, s.id)
	})

	s.agents = res.map(item => item.agent)
}
