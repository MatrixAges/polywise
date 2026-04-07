import type { SkillMeta } from '../../types'

const tokenize = (text: string): Array<string> => {
	return text
		.toLowerCase()
		.split(/[\s\-_.,;:!?/\\()[\]{}<>@#$%^&*+=|~`"']+/)
		.filter(t => t.length > 1)
}

export default (
	skill_map: Array<SkillMeta>,
	keyword: string,
	max_results: number
): Array<SkillMeta & { score: number }> => {
	const tokens = tokenize(keyword)

	if (tokens.length === 0) return []

	const scored: Array<SkillMeta & { score: number }> = []

	for (const skill of skill_map) {
		const name_tokens = tokenize(skill.name)
		const desc_tokens = tokenize(skill.description)
		const all_tokens = [...name_tokens, ...desc_tokens]

		let hits = 0

		for (const token of tokens) {
			if (all_tokens.some(t => t.includes(token) || token.includes(t))) {
				hits++
			}
		}

		if (hits > 0) {
			scored.push({ ...skill, score: hits / tokens.length })
		}
	}

	scored.sort((a, b) => b.score - a.score)

	return scored.slice(0, max_results)
}
