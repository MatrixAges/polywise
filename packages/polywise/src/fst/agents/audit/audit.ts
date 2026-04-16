import getAuditSessionPrompt from '@core/consts/prompts/getAuditSessionPrompt'

import extract from '../permission/extract'
import { formatContext, formatPermissions } from '../permission/format'
import createAuditAgent from './agent'

import type Session from '../../session'
import type { AuditAgentOutput } from './agent'

export default async (s: Session, content: string) => {
	const agent = createAuditAgent(s.model.model)

	const context_summary = formatContext(s.context)
	const recent_messages = s.model_messages.slice(-4).map(extract).filter(Boolean).join('\n')
	const approved_permissions = formatPermissions(s.permissions)

	const res = await agent.generate({
		prompt: getAuditSessionPrompt({
			content,
			files_dir: s.files_dir,
			cwd: s.cwd,
			context_summary,
			recent_messages,
			approved_permissions
		})
	})

	return Boolean((res.output as AuditAgentOutput)?.approved)
}
