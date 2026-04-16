import type { CustomToolMeta } from '@core/fst/types'

export default (custom_tools_map: Array<CustomToolMeta>) => {
	if (custom_tools_map.length === 0) {
		return [
			'Available Custom Tools:',
			'None. Use meta_tool to create or discover custom tools.',
			'Custom tools are not exposed as direct callable tools.',
			'Use meta_tool as the only bridge to search, inspect, and execute custom tools.'
		].join('\n')
	}

	const lines = custom_tools_map.map(custom_tool => `- ${custom_tool.name}: ${custom_tool.description}`)

	return [
		'Available Custom Tools:',
		...lines,
		'Custom tools are not exposed as direct callable tools.',
		'Use meta_tool to search or read a custom tool before execution.',
		'Use meta_tool with action "execute" and tool_name to run a specific custom tool.',
		'Custom tool code is loaded lazily only inside meta_tool execution.',
		'Use meta_tool to create, remove, or rebuild custom tool routing.'
	].join('\n')
}
