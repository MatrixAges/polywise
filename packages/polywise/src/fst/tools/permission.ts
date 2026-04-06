import { tool } from 'ai'

import { checkPermission, requestApproval } from '../session/permission'

import type { Tool, ToolSet } from 'ai'
import type Index from '../session'

type ToolConfig = {
	tool_type: 'glob'
	path_extractor: (input: Record<string, unknown>) => Array<{ action: string; path: string }>
}

const glob_tool_config: ToolConfig = {
	tool_type: 'glob',
	path_extractor: input => {
		const patterns = input.patterns as Array<string> | undefined
		if (!patterns || patterns.length === 0) return []

		const paths: Array<{ action: string; path: string }> = []

		for (const pattern of patterns) {
			paths.push({ action: 'read', path: pattern })
		}

		return paths
	}
}

const tool_configs: Record<string, ToolConfig> = {
	glob: glob_tool_config
}

export const wrapToolWithPermission = (s: Index, tool_name: string, base_tool: Tool) => {
	const config = tool_configs[tool_name]

	if (!config) {
		return base_tool
	}

	const original_execute = base_tool.execute

	return tool({
		description: base_tool.description,
		inputSchema: base_tool.inputSchema,
		execute: async (input: unknown, context: unknown) => {
			const input_obj = input as Record<string, unknown>
			const paths = config.path_extractor(input_obj)

			for (const { action, path } of paths) {
				const result = checkPermission(s, config.tool_type, action, path)

				if (result === 'needs_approval') {
					const approved = await requestApproval(s, config.tool_type, action, path)

					if (!approved) {
						throw new Error(`Permission denied: ${config.tool_type} ${action} ${path}`)
					}
				}
			}

			if (original_execute) {
				return original_execute(input, context as Parameters<NonNullable<typeof original_execute>>[1])
			}

			return null
		}
	})
}

export const wrapToolsWithPermission = (s: Index, tools: ToolSet): ToolSet => {
	const wrapped: ToolSet = {}

	for (const [name, base_tool] of Object.entries(tools)) {
		wrapped[name] = wrapToolWithPermission(s, name, base_tool)
	}

	return wrapped
}
