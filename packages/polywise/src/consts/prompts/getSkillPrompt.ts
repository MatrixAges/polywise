import type { SkillMeta } from '@core/fst/types'

export default (skill_map: Array<SkillMeta>) => {
	if (skill_map.length === 0) {
		return 'Available Skills:\nNone. Use skill_tool to search, read, create, update, or rebuild local skills when skill management is actually needed.'
	}

	const lines = skill_map.map(skill => `- ${skill.name}: ${skill.description}`)

	return [
		'Available Skills:',
		...lines,
		'Use skill_tool to search exact matches, inspect a skill, create or update a skill, or rebuild the local skill index.',
		'Do not create or update skills during the active session unless the user explicitly asks for skill management.'
	].join('\n')
}
