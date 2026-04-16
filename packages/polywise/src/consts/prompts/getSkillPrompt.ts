import type { SkillMeta } from '@core/fst/types'

export default (skill_map: Array<SkillMeta>) => {
	if (skill_map.length === 0) {
		return 'Available Skills:\nNone. Use skill_tool to search, read, or rebuild local skills.'
	}

	const lines = skill_map.map(skill => `- ${skill.name}: ${skill.description}`)

	return [
		'Available Skills:',
		...lines,
		'Use skill_tool to search exact matches, inspect a skill, or rebuild the local skill index.'
	].join('\n')
}
