import createAuditAgent from './agent'
import getPrompt from './getPrompt'

import type Session from '../../session'
import type { AuditAgentOutput } from './agent'

export default async (s: Session, content: string) => {
	const agent = createAuditAgent(s.model.model)
	const res = await agent.generate({ prompt: getPrompt(s, content) })

	return Boolean((res.output as AuditAgentOutput)?.approved)
}
