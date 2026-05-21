import path from 'path'
import { skill } from '@core/db/schema'
import { getSkill } from '@core/db/services'
import { writeFile } from 'atomically'
import { eq } from 'drizzle-orm'
import fs from 'fs-extra'
import { object, string } from 'zod'

import { p } from '../../utils/trpc'
import { assertSkillEntryPath, getSkillItemDirPath } from './utils'

const input_type = object({
	skill_id: string(),
	path: string(),
	content: string()
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/skill/saveFile',
			summary: 'Run Save File'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		const current_skill = await getSkill(eq(skill.id, input.skill_id))

		if (!current_skill) {
			throw new Error(`Skill not found: ${input.skill_id}`)
		}

		const skill_dir = getSkillItemDirPath(current_skill)
		const { entry_path } = assertSkillEntryPath({
			skill_dir,
			target_path: input.path,
			error_message: 'Invalid skill file path'
		})

		if (path.basename(entry_path) === 'SKILL.md') {
			throw new Error('SKILL.md must be updated through skill.update')
		}

		await fs.ensureDir(path.dirname(entry_path))
		await writeFile(entry_path, input.content, 'utf8')

		return {
			path: entry_path,
			name: path.basename(entry_path),
			contents: input.content
		}
	})
