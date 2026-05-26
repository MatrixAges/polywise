import { agent, agent_session } from '@core/db/schema'
import { env } from '@core/env'
import { eq } from 'drizzle-orm'

import { getAgentSessionPrompt } from '../../consts/prompts/getAgentPrompt'

export default async (session_id: string) => {
	const agent_row = await env.db
		.select({ agent })
		.from(agent_session)
		.innerJoin(agent, eq(agent_session.agent_id, agent.id))
		.where(eq(agent_session.session_id, session_id))
		.limit(1)
		.then(res => res[0])

	if (!agent_row) {
		return ''
	}

	return getAgentSessionPrompt(agent_row.agent)
}
