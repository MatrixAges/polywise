export const configurable_session_tool_items = [
	{
		key: 'web_search_tool',
		label: 'Web Search',
		description: 'Search the web for current information.'
	},
	{
		key: 'web_fetch_tool',
		label: 'Web Fetch',
		description: 'Fetch and read web pages directly.'
	},
	{
		key: 'content_tool',
		label: 'File Content',
		description: 'Read larger file ranges from the session workspace.'
	},
	{
		key: 'search_file_tool',
		label: 'File Search',
		description: 'Search for matching text across files.'
	},
	{
		key: 'glob_tool',
		label: 'Glob',
		description: 'List files by glob pattern.'
	},
	{
		key: 'meta_tool',
		label: 'Custom Tools',
		description: 'Discover installed custom tools.'
	},
	{
		key: 'mcp_tool',
		label: 'MCP',
		description: 'Search and execute configured MCP servers lazily.'
	},
	{
		key: 'read_file_tool',
		label: 'Read File',
		description: 'Read specific files from the workspace.'
	},
	{
		key: 'bash_tool',
		label: 'Shell',
		description: 'Run shell commands in the workspace.'
	},
	{
		key: 'write_file_tool',
		label: 'Write File',
		description: 'Create or overwrite files in the workspace.'
	},
	{
		key: 'edit_file_tool',
		label: 'Edit File',
		description: 'Apply targeted edits to existing files.'
	}
] as const

export type ConfigurableSessionToolKey = (typeof configurable_session_tool_items)[number]['key']
export const configurable_sub_agent_items = [
	{
		key: 'system_agent',
		label: 'System Agent',
		description: 'Expose the internal `system_tool` delegation path for runtime execution.'
	},
	{
		key: 'superego_agent',
		label: 'Superego Agent',
		description: 'Run the reflection loop that extracts durable lessons from recent conversations.'
	},
	{
		key: 'trim_agent',
		label: 'Trim Agent',
		description: 'Compact long message history automatically when the context grows too large.'
	},
	{
		key: 'skill_creator',
		label: 'Skill Creator',
		description: 'Allow superego to create or update reusable skills from validated patterns.'
	}
] as const

export type SessionSubAgentKey = (typeof configurable_sub_agent_items)[number]['key']

export interface SessionRuntimeConfig {
	disable_map: Array<string>
	mode: 'normal' | 'plan' | 'plan-exec'
	audit_mode: 'limited' | 'auto' | 'full'
	enable_sub_agent: boolean
	sub_agent_keys: Array<SessionSubAgentKey>
	enable_agent_tool: boolean
	agent_ids: Array<string>
}

export const default_session_runtime_config: SessionRuntimeConfig = {
	disable_map: [],
	mode: 'normal',
	audit_mode: 'auto',
	enable_sub_agent: true,
	sub_agent_keys: configurable_sub_agent_items.map(item => item.key),
	enable_agent_tool: true,
	agent_ids: []
}

const normalizeSubAgentKeys = (input: Partial<SessionRuntimeConfig> | null | undefined): Array<SessionSubAgentKey> => {
	if (Array.isArray(input?.sub_agent_keys)) {
		return Array.from(
			new Set(
				input.sub_agent_keys.filter((value): value is SessionSubAgentKey =>
					configurable_sub_agent_items.some(item => item.key === value)
				)
			)
		)
	}

	if (input?.enable_sub_agent === false) {
		return []
	}

	return [...default_session_runtime_config.sub_agent_keys]
}

export const normalizeSessionRuntimeConfig = (
	input: Partial<SessionRuntimeConfig> | null | undefined
): SessionRuntimeConfig => {
	const disable_map = Array.isArray(input?.disable_map)
		? Array.from(
				new Set(
					input.disable_map
						.filter((value): value is string => typeof value === 'string')
						.map(value => value.trim())
						.filter(Boolean)
				)
			)
		: default_session_runtime_config.disable_map

	const agent_ids = Array.isArray(input?.agent_ids)
		? Array.from(
				new Set(
					input.agent_ids
						.filter((value): value is string => typeof value === 'string')
						.map(value => value.trim())
						.filter(Boolean)
				)
			)
		: default_session_runtime_config.agent_ids

	const mode =
		input?.mode === 'normal' || input?.mode === 'plan' || input?.mode === 'plan-exec'
			? input.mode
			: default_session_runtime_config.mode

	const audit_mode =
		input?.audit_mode === 'limited' || input?.audit_mode === 'auto' || input?.audit_mode === 'full'
			? input.audit_mode
			: default_session_runtime_config.audit_mode
	const sub_agent_keys = normalizeSubAgentKeys(input)

	return {
		disable_map,
		mode,
		audit_mode,
		enable_sub_agent: sub_agent_keys.length > 0,
		sub_agent_keys,
		enable_agent_tool:
			typeof input?.enable_agent_tool === 'boolean'
				? input.enable_agent_tool
				: default_session_runtime_config.enable_agent_tool,
		agent_ids
	}
}

export const hasSessionSubAgent = (config: Pick<SessionRuntimeConfig, 'sub_agent_keys'>, key: SessionSubAgentKey) =>
	config.sub_agent_keys.includes(key)
