import path from 'path'
import fs from 'fs-extra'

import rebuildSkillMap from './rebuild'

import type Session from '../../session'

export default async (s: Session) => {
	const skill_map_path = path.resolve(s.skills_dir, 'skill_map.json')

	await fs.ensureDir(s.skills_dir)

	const exists = await fs.pathExists(skill_map_path)

	if (!exists) {
		return rebuildSkillMap(s)
	}

	const skill_map = await fs.readJson(skill_map_path, { throws: false })

	if (!Array.isArray(skill_map)) {
		return rebuildSkillMap(s)
	}

	s.skill_map = skill_map

	return skill_map
}
