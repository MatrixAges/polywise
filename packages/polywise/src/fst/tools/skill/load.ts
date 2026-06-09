import { readAgentRuntimeConfig } from '@core/db/agentConfig'
import { getAgentSkills } from '@core/db/services/externals'

import readSkillMap from './read'

import type Session from '../../session'

export default async (s: Session) => {
	const skill_map = await readSkillMap(s)

	if (!s.owner_agent) {
		return skill_map
	}

	const [selected_skill_rows, runtime_config] = await Promise.all([
		getAgentSkills(s.owner_agent.id),
		readAgentRuntimeConfig(s.owner_agent.id)
	])
	const enabled_skill_id_set = new Set(
		runtime_config.has_skills
			? runtime_config.config.skills.filter(item => item.enabled).map(item => item.skill_id)
			: selected_skill_rows.map(item => item.skill.id)
	)
	const enabled_skill_name_set = new Set(
		selected_skill_rows.filter(item => enabled_skill_id_set.has(item.skill.id)).map(item => item.skill.name)
	)

	s.skill_map = skill_map.filter(item => enabled_skill_name_set.has(item.name))

	return s.skill_map
}
