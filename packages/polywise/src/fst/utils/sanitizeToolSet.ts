import { asSchema } from 'ai'

import type { ToolSet } from 'ai'

const getErrorMessage = (error: unknown) => {
	return error instanceof Error ? error.message : String(error)
}

type Options = {
	schema_tool_names?: string[]
}

export default (toolset: ToolSet, options?: Options) => {
	const valid_entries = [] as Array<[string, ToolSet[string]]>
	const schema_tool_names = new Set(options?.schema_tool_names ?? [])

	for (const [tool_name, tool_item] of Object.entries(toolset)) {
		if (!tool_item || typeof tool_item !== 'object') {
			valid_entries.push([tool_name, tool_item])
			continue
		}

		try {
			if (
				schema_tool_names.has(tool_name) &&
				'inputSchema' in tool_item &&
				tool_item.inputSchema !== undefined
			) {
				tool_item.inputSchema = asSchema(tool_item.inputSchema)
			}

			if (
				schema_tool_names.has(tool_name) &&
				'outputSchema' in tool_item &&
				tool_item.outputSchema !== undefined
			) {
				tool_item.outputSchema = asSchema(tool_item.outputSchema)
			}

			valid_entries.push([tool_name, tool_item])
		} catch (error) {
			console.warn(`[polywise] skip invalid tool "${tool_name}": ${getErrorMessage(error)}`)
		}
	}

	return Object.fromEntries(valid_entries) as ToolSet
}
