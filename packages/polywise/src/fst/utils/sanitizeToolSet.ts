import type { ToolSet } from 'ai'

const getErrorMessage = (error: unknown) => {
	return error instanceof Error ? error.message : String(error)
}

export default (toolset: ToolSet) => {
	const valid_entries = [] as Array<[string, ToolSet[string]]>

	for (const [tool_name, tool_item] of Object.entries(toolset)) {
		if (!tool_item || typeof tool_item !== 'object') {
			valid_entries.push([tool_name, tool_item])
			continue
		}

		try {
			valid_entries.push([tool_name, tool_item])
		} catch (error) {
			console.warn(`[polywise] skip invalid tool "${tool_name}": ${getErrorMessage(error)}`)
		}
	}

	return Object.fromEntries(valid_entries) as ToolSet
}
