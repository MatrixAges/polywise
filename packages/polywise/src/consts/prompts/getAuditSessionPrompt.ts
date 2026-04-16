import getAuditPrompt from './getAuditPrompt'

export default (args: {
	content: string
	files_dir: string
	cwd: string
	context_summary: string
	recent_messages: string
	approved_permissions: string
}) => {
	return getAuditPrompt({
		tool: 'cron_content',
		action: 'audit',
		path: args.content,
		files_dir: args.files_dir,
		cwd: args.cwd,
		context_summary: args.context_summary,
		recent_messages: args.recent_messages,
		approved_permissions: args.approved_permissions
	})
}
