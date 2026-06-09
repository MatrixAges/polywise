import { readAgentRuntimeConfig } from '@core/db/agentConfig'
import { normalizeAgentTools } from '@core/db/agentTool'
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

	const target_agent = res[0]?.agent

	if (!target_agent) {
		s.owner_agent = null

		return
	}

	const runtime_config = await readAgentRuntimeConfig(target_agent.id)

	s.owner_agent = {
		...target_agent,
		tools: runtime_config.has_tools ? runtime_config.config.tools : normalizeAgentTools(target_agent.tools)
	}
}
