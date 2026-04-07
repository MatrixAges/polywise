import { buildSkillMap } from '../../tools/skill'

import type Session from '../index'

export default async (s: Session) => {
	s.skill_map = await buildSkillMap(s.cwd)

	return s.skill_map
}
