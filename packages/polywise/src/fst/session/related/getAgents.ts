import { agent, session_agent } from '@core/db/schema'
import { env } from '@core/env'
import { eq } from 'drizzle-orm'

import type Index from '../index'

export default async (s: Index) => {
	const res = await env.db
		.select({ agent })
		.from(session_agent)
		.innerJoin(agent, eq(session_agent.agent_id, agent.id))
		.where(eq(session_agent.session_id, s.id))

	s.agents = res.map(item => item.agent)
}
