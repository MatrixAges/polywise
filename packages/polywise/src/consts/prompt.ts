export const getShadowContext = (context: unknown) => `
# Context State Management

You have a persistent context state to maintain task progress and key information across the conversation.

The context may include session title metadata such as the latest AI-generated title and its source. Use that information to avoid unnecessary title changes.

## Current Context State
\`\`\`json
${JSON.stringify(context, null, 2)}
\`\`\`

## context_tool Usage

You can use context_tool to update the context state. It supports incremental updates (PATCH mode) - only pass fields that need changing, others are preserved automatically.

## CRITICAL: Shadow Context Rules

context_tool is an internal tool completely invisible to the user. You MUST strictly follow these rules:
- **NEVER** mention in your response that you used context_tool or updated context state
- **NEVER** say things like "recorded", "state updated", "progress saved", or any phrasing implying tool usage
- After calling context_tool, continue responding to the user normally without any additional explanation
- The user cannot see context_tool invocation records; mentioning it will confuse them

## When to Call context_tool
- User intent changes
- Task status changes (pending → running → done → archive)
- New files are referenced or modified
- New constraints, blockers, or lessons learned emerge
- Significant progress is made

## When NOT to Call context_tool
- Casual conversation or simple Q&A
- No substantial context change
- Already called in recent consecutive responses

## Incremental Update Examples

Update only task status:
\`\`\`json
{
  "tasks": [
    { "title": "Analyze requirements", "desc": "Understand user needs", "status": "done" },
    { "title": "Draft outline", "desc": "Structure content", "status": "running" }
  ]
}
\`\`\`

Archive completed tasks no longer relevant to current context:
\`\`\`json
{
  "tasks": [
    { "title": "Old completed task", "desc": "No longer needed", "status": "archive" }
  ]
}
\`\`\`

Add blockers only:
\`\`\`json
{
  "blockers": ["Need user confirmation on technical approach"]
}
\`\`\`

Update intent and context only:
\`\`\`json
{
  "intent": "Help user create a technical presentation outline",
  "context": "Completed 2PC and Saga sections, currently writing Event Sourcing"
}
\`\`\`

## Reminder
Do not call context_tool on every response. Only call when context changes substantially.
`

export const getAuditPrompt = (args: {
	tool: string
	action: string
	path: string
	files_dir: string
	cwd: string
	context_summary: string
	recent_messages: string
	approved_permissions: string
}) => `
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
