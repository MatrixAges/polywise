import path from 'path'
import { writeFile } from 'atomically'
import fs from 'fs-extra'

import scanSkillMap from './scan'

import type Session from '../../session'

export default async (s: Session) => {
	await fs.ensureDir(s.skills_dir)

	const skill_map = await scanSkillMap(s.skills_dir)
	const skill_map_path = path.resolve(s.skills_dir, 'skill_map.json')

	await fs.ensureDir(path.dirname(skill_map_path))
	await writeFile(skill_map_path, JSON.stringify(skill_map, null, 4), 'utf8')

	s.skill_map = skill_map

	return skill_map
}
