import path from 'path'
import { skill } from '@core/db/schema'
import { getSkill } from '@core/db/services'
import { eq } from 'drizzle-orm'
import fs from 'fs-extra'
import { object, string } from 'zod'

import { p } from '../../utils/trpc'
import { assertSkillEntryPath, getSkillItemDirPath } from './utils'

const input_type = object({
	skill_id: string(),
	path: string()
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/skill/removeEntry',
			description: 'Delete one file or folder inside a skill directory.'
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
			error_message: 'Invalid skill entry path'
		})

		if (path.basename(entry_path) === 'SKILL.md') {
			throw new Error('SKILL.md cannot be removed')
		}

		await fs.remove(entry_path)

		return { path: entry_path }
	})
