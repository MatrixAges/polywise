import { getAuditPrompt } from '@core/consts/prompt'

import { extractMessageText } from './extractMessageText'

import type Index from '../index'

export default (s: Index, tool: string, action: string, path: string): string => {
	const context_summary = s.context.intent
		? `User intent: ${s.context.intent}`
		: 'No explicit user intent in context'

	const recent_messages = s.model_messages.slice(-6).map(extractMessageText).filter(Boolean).join('\n')

	return getAuditPrompt({
		tool,
		action,
		path,
		files_dir: s.files_dir,
		project_dirs: s.projects.map(p => p.dir).join(', '),
		context_summary,
		recent_messages
	})
}
