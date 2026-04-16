import type { CustomToolMeta } from '@core/fst/types'

export default (custom_tools_map: Array<CustomToolMeta>) => {
	if (custom_tools_map.length === 0) {
		return 'Available Custom Tools:\nNone. Use meta_tool to create or discover custom tools.'
	}

	const lines = custom_tools_map.map(custom_tool => `- ${custom_tool.name}: ${custom_tool.description}`)

	return [
		'Available Custom Tools:',
		...lines,
		'Use meta_tool to search, inspect, execute, create, remove, or rebuild custom tool routing.',
		'Custom tool code is loaded lazily only when a specific custom tool is actually called.'
	].join('\n')
}
