import { config } from '@core/config'
import { blocked_session_id } from '@core/consts'
import { listConfiguredMcps } from '@core/fst/mcp'
import { configurable_session_tool_items, hasSessionSubAgent } from '@core/fst/session/config/shared'
import { connectSession, p } from '@core/utils'
import { array, enum as Enum, object, string } from 'zod'

const input_type = object({
	id: string()
})
const output_type = array(
	object({
		kind: Enum(['tool', 'mcp']),
		name: string(),
		description: string(),
		transport_type: Enum(['local', 'remote']).optional()
	})
)

const builtin_tool_descriptions = {
	agent_tool: 'Consult available agents in the current session context.',
	system_tool: 'Delegate work through the internal system agent path.'
} as const

const blocked_session_tool_items = [
	{
		kind: 'tool' as const,
		name: 'polywise_tool',
		description: 'Inspect and call Polywise local backend capabilities from the panel session.'
	}
] as const

const blocked_session_page_tool_item = {
	kind: 'tool' as const,
	name: 'page_tool',
	description: 'Inspect app pages and navigate the current panel session.'
} as const

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/session/getMentionTools',
			description: 'Read Get Mention Tools'
		}
	})
	.input(input_type)
	.output(output_type)
	.query(async ({ input }) => {
		const session = await connectSession({ id: input.id })
		const disable_map = new Set(session.disable_map)
		const extra_items =
			input.id === blocked_session_id
				? blocked_session_tool_items.filter(item => !disable_map.has(item.name))
				: []
		const items: Array<{
			kind: 'tool' | 'mcp'
			name: string
			description: string
			transport_type?: 'local' | 'remote'
		}> = configurable_session_tool_items
			.filter(item => !(config.prompt_full_inject === true && item.key === 'prompt_tool'))
			.filter(item => !disable_map.has(item.key))
			.map(item => ({
				kind: 'tool',
				name: item.key,
				description: item.description
			}))

		if (session.enable_agent_tool && !disable_map.has('agent_tool')) {
			items.push({
				kind: 'tool',
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
				kind: 'tool',
				name: 'system_tool',
				description: builtin_tool_descriptions.system_tool
			})
		}

		for (const mcp_item of listConfiguredMcps(session.disable_map)) {
			items.push({
				kind: 'mcp',
				name: mcp_item.name,
				description: mcp_item.description,
				transport_type: mcp_item.type
			})
		}

		items.push(...extra_items)

		if (
			input.id === blocked_session_id &&
			config.page_bridge_enabled === true &&
			!disable_map.has(blocked_session_page_tool_item.name)
		) {
			items.push(blocked_session_page_tool_item)
		}

		return items.sort((a, b) => {
			if (a.kind !== b.kind) {
				return a.kind === 'tool' ? -1 : 1
			}

			return a.name.localeCompare(b.name)
		})
	})
