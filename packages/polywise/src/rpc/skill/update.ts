import path from 'path'
import { skill } from '@core/db/schema'
import { getSkill, setSkill } from '@core/db/services'
import { writeFile } from 'atomically'
import { eq } from 'drizzle-orm'
import fs from 'fs-extra'
import { object, string } from 'zod'

import { p } from '../../utils/trpc'
import { getSkillDirPath, getSkillFilePath, rebuildGlobalSkillMap } from './utils'

const input_type = object({
	id: string(),
	name: string(),
	desc: string(),
	content: string(),
	type: string().optional()
})

export default p.input(input_type).mutation(async ({ input }) => {
	const current_skill = await getSkill(eq(skill.id, input.id))

	if (!current_skill) {
		throw new Error(`Skill not found: ${input.id}`)
	}

	const file_path = getSkillFilePath(input.name)
	const prev_dir_path = current_skill.path

	await fs.ensureDir(path.dirname(file_path))
	await writeFile(file_path, input.content, 'utf8')

	if (prev_dir_path && prev_dir_path !== getSkillDirPath(input.name)) {
		await fs.remove(prev_dir_path.endsWith('SKILL.md') ? path.dirname(prev_dir_path) : prev_dir_path)
	}

	const next_skill = await setSkill(eq(skill.id, input.id), {
		name: input.name,
		desc: input.desc,
		path: getSkillDirPath(input.name),
		type: input.type,
		updated_at: new Date()
	})

	await rebuildGlobalSkillMap()

	return next_skill
})
