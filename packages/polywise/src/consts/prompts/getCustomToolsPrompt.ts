import type { CustomToolMeta } from '@core/fst/types'

export default (custom_tools_map: Array<CustomToolMeta>) => {
	if (custom_tools_map.length === 0) {
		return [
			'Available Custom Tools:',
			'None. Use meta_tool to create or discover custom tools.',
			'Custom tools are not exposed as direct callable tools.',
			'Use meta_tool as the only bridge to search, inspect, create, remove, and execute custom tools.',
			'Never use bash_tool, read_file_tool, write_file_tool, edit_file_tool, or system_tool to scan or modify custom tool files.',
			'If you need a new custom tool, call meta_tool with action "create" directly instead of searching the filesystem first.'
		].join('\n')
	}

	const lines = custom_tools_map.map(custom_tool => `- ${custom_tool.name}: ${custom_tool.description}`)

	return [
		'Available Custom Tools:',
		...lines,
		'Custom tools are not exposed as direct callable tools.',
		'Never use bash_tool, read_file_tool, write_file_tool, edit_file_tool, or system_tool to discover, inspect, create, modify, or execute custom tool files.',
		'Use meta_tool to search or read a custom tool before execution.',
		'Use meta_tool with action "create" to make a new custom tool. Do not scan the filesystem first.',
		'Use meta_tool with action "execute" and tool_name to run a specific custom tool.',
		'Custom tool code is loaded lazily only inside meta_tool execution.',
		'Use meta_tool to create, remove, or rebuild custom tool routing.'
	].join('\n')
}
