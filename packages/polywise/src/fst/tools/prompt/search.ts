import type { PromptMeta } from './types'

const getScore = (value: string, keyword: string) => {
	const lower_value = value.toLowerCase()
	const lower_keyword = keyword.toLowerCase().trim()

	if (!lower_keyword) return 0
	if (lower_value === lower_keyword) return 160
	if (lower_value.startsWith(lower_keyword)) return 110
	if (lower_value.includes(lower_keyword)) return 60

	return 0
}

export default (prompt_map: Array<PromptMeta>, keyword: string, max_results: number) => {
	const results = [] as Array<PromptMeta & { score: number }>

	for (const prompt of prompt_map) {
		const score =
			getScore(prompt.path, keyword) +
			getScore(prompt.summary, keyword) +
			getScore(prompt.kind, keyword) +
			getScore(`${prompt.path} ${prompt.summary} ${prompt.kind}`, keyword)

		if (score > 0) {
			results.push({ ...prompt, score })
		}
	}

	return results.sort((a, b) => b.score - a.score).slice(0, max_results)
}
