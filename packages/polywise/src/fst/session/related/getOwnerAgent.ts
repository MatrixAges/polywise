import { agent, agent_session } from '@core/db/schema'
import { env } from '@core/env'
import { eq } from 'drizzle-orm'

import type Index from '../index'

export default async (s: Index) => {
	const res = await env.db
		.select({ agent })
		.from(agent_session)
		.innerJoin(agent, eq(agent_session.agent_id, agent.id))
		.where(eq(agent_session.session_id, s.id))
		.limit(1)

	s.owner_agent = res[0]?.agent ?? null
}
