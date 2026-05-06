import path from 'path'
import { addSkill, getSkillOrderMax } from '@core/db/services'
import { writeFile } from 'atomically'
import fs from 'fs-extra'
import { object, string } from 'zod'

import { p } from '../../utils/trpc'
import { getSkillDirPath, getSkillFilePath, rebuildGlobalSkillMap } from './utils'

const input_type = object({
	name: string(),
	desc: string(),
	content: string(),
	type: string().optional()
})

export default p.input(input_type).mutation(async ({ input }) => {
	const skill_dir_name = input.name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')

	if (!skill_dir_name) {
		throw new Error('Invalid skill name')
	}

	const file_path = getSkillFilePath(input.name)

	if (await fs.pathExists(file_path)) {
		throw new Error(`Skill already exists: ${input.name}`)
	}

	await fs.ensureDir(path.dirname(file_path))
	await writeFile(file_path, input.content, 'utf8')

	const order = (await getSkillOrderMax()) + 1

	const skill_item = await addSkill({
		name: input.name,
		desc: input.desc,
		path: getSkillDirPath(input.name),
		order,
		type: input.type
	})

	await rebuildGlobalSkillMap()

	return skill_item
})
