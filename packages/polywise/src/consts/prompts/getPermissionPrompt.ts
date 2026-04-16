import getAuditPrompt from './getAuditPrompt'

export default (args: {
	tool: string
	action: string
	path: string
	files_dir: string
	cwd: string
	context_summary: string
	recent_messages: string
	approved_permissions: string
}) => {
	return getAuditPrompt(args)
}
