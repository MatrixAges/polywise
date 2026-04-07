import { getAuditPrompt } from '@core/consts/prompt'

import extract from './extract'
import { formatContext, formatPermissions } from './format'

import type Session from '../../session'

export default (s: Session, tool: string, action: string, path: string) => {
	const context_summary = formatContext(s.context)
	const recent_messages = s.model_messages.slice(-4).map(extract).filter(Boolean).join('\n')
	const approved_permissions = formatPermissions(s.permissions)

	return getAuditPrompt({
		tool,
		action,
		path,
		files_dir: s.files_dir,
		cwd: s.cwd,
		context_summary,
		recent_messages,
		approved_permissions
	})
}
