import path from 'path'
import { skill } from '@core/db/schema'
import { getSkill } from '@core/db/services'
import { writeFile } from 'atomically'
import { eq } from 'drizzle-orm'
import fs from 'fs-extra'
import { object, string } from 'zod'

import { p } from '../../utils/trpc'

const input_type = object({
	skill_id: string(),
	path: string(),
	content: string()
})

export default p.input(input_type).mutation(async ({ input }) => {
	const current_skill = await getSkill(eq(skill.id, input.skill_id))

	if (!current_skill) {
		throw new Error(`Skill not found: ${input.skill_id}`)
	}

	const skill_dir = current_skill.path.endsWith('SKILL.md') ? path.dirname(current_skill.path) : current_skill.path
	const target_path = path.resolve(input.path)
	const relative_path = path.relative(skill_dir, target_path)

	if (relative_path.startsWith('..') || path.isAbsolute(relative_path) || relative_path.includes(`..${path.sep}`)) {
		throw new Error('Invalid skill file path')
	}

	await fs.ensureDir(path.dirname(target_path))
	await writeFile(target_path, input.content, 'utf8')

	return {
		path: target_path,
		name: path.basename(target_path),
		contents: input.content
	}
})
