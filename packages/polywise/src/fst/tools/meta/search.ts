import type { CustomToolMeta } from '../../types'

const getScore = (value: string, keyword: string) => {
	const lower_value = value.toLowerCase()
	const lower_keyword = keyword.toLowerCase().trim()

	if (!lower_keyword) return 0
	if (lower_value === lower_keyword) return 120
	if (lower_value.startsWith(lower_keyword)) return 80
	if (lower_value.includes(lower_keyword)) return 40

	return 0
}

export default (custom_tools_map: Array<CustomToolMeta>, keyword: string, max_results: number) => {
	const results = [] as Array<CustomToolMeta & { score: number }>

	for (const custom_tool of custom_tools_map) {
		const score =
			getScore(custom_tool.name, keyword) +
			getScore(custom_tool.description, keyword) +
			getScore(`${custom_tool.name} ${custom_tool.description}`, keyword)

		if (score > 0) {
			results.push({ ...custom_tool, score })
		}
	}

	return results.sort((a, b) => b.score - a.score).slice(0, max_results)
}
