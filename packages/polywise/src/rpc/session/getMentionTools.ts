import { loadMcpTools } from '@core/fst/mcp'
import { configurable_session_tool_items, hasSessionSubAgent } from '@core/fst/session/config/shared'
import { connectSession, p } from '@core/utils'
import { object, string } from 'zod'

const input_type = object({
	id: string()
})

const builtin_tool_descriptions = {
	agent_tool: 'Consult available agents in the current session context.',
	system_tool: 'Delegate work through the internal system agent path.'
} as const

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/session/getMentionTools',
			summary: 'Read Get Mention Tools'
		}
	})
	.input(input_type)
	.query(async ({ input }) => {
		const session = await connectSession({ id: input.id })
		const disable_map = new Set(session.disable_map)
		const items: Array<{ name: string; description: string }> = configurable_session_tool_items
			.filter(item => !disable_map.has(item.key))
			.map(item => ({
				name: item.key,
				description: item.description
			}))

		if (session.enable_agent_tool && !disable_map.has('agent_tool')) {
			items.push({
				name: 'agent_tool',
				description: builtin_tool_descriptions.agent_tool
			})
		}

		if (
			session.audit_mode === 'auto' &&
			hasSessionSubAgent(session, 'system_agent') &&
			!disable_map.has('system_tool')
		) {
			items.push({
				name: 'system_tool',
				description: builtin_tool_descriptions.system_tool
			})
		}

		const mcp_tools = await loadMcpTools(session)

		for (const [name, tool_item] of Object.entries(mcp_tools)) {
			const description =
				typeof tool_item === 'object' &&
				tool_item &&
				'description' in tool_item &&
				typeof tool_item.description === 'string'
					? tool_item.description
					: ''

			items.push({
				name,
				description
			})
		}

		return items.sort((a, b) => a.name.localeCompare(b.name))
	})
