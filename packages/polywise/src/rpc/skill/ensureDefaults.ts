import defaultSkillCreator from '@core/fst/agents/skill_creator/defaultSkill'

import { ensureSkillDefaults } from './utils'

export default async () => {
	await ensureSkillDefaults({
		name: 'skill-creator',
		desc: 'Use this meta-skill when a conversation reveals a reusable workflow, repeated failure pattern, or missing recovery path that should be converted into a reusable local skill.',
		content: defaultSkillCreator,
		type: 'system'
	})
}
