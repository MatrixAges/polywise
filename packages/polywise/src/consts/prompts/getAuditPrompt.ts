interface Args {
	tool: string
	action: string
	path: string
	files_dir: string
	cwd: string
	context_summary: string
	recent_messages: string
	approved_permissions: string
}

export default (args: Args) => `
Evaluate this operation:

## Operation Details
- Tool: ${args.tool}
- Action: ${args.action}
- Target: ${args.path}

## Known Safe Directories
- Session files: ${args.files_dir}
- Working directory: ${args.cwd}

## Previously Approved Permissions
${args.approved_permissions}

## User Intent & Context
${args.context_summary}

## Recent Conversation
${args.recent_messages}

## Decision Question
Does this operation serve the user's legitimate intent?

If YES → approve: true
If NO or SUSPICIOUS → approve: false

Remember: Only deny operations that are malicious, don't serve the user's intent, or are dangerous.`
