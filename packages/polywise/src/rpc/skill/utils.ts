import path from 'path'
import { app } from '@core/consts'
import rebuildSkillMap from '@core/fst/tools/skill/rebuild'

const getSkillDirName = (name: string) => {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
}

export const getSkillDirPath = (name: string) => path.resolve(app.app_path, 'skills', getSkillDirName(name))

export const getSkillFilePath = (name: string) => path.resolve(getSkillDirPath(name), 'SKILL.md')

export const rebuildGlobalSkillMap = async () => {
	return rebuildSkillMap({ skills_dir: path.resolve(app.app_path, 'skills'), skill_map: [] } as never)
}
