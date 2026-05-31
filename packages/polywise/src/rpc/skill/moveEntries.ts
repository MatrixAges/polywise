import path from 'path'
import { skill } from '@core/db/schema'
import { getSkill } from '@core/db/services'
import { eq } from 'drizzle-orm'
import fs from 'fs-extra'
import { array, object, string } from 'zod'

import { p } from '../../utils/trpc'
import { assertSkillEntryPath, getSkillItemDirPath } from './utils'

const input_type = object({
	skill_id: string(),
	operations: array(
		object({
			from: string(),
			to: string()
		})
	)
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/skill/moveEntries',
			description: 'Move one or more files or folders inside a skill directory.'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		const current_skill = await getSkill(eq(skill.id, input.skill_id))

		if (!current_skill) {
			throw new Error(`Skill not found: ${input.skill_id}`)
		}

		const skill_dir = getSkillItemDirPath(current_skill)

		for (const item of input.operations) {
			const { entry_path: from_path } = assertSkillEntryPath({
				skill_dir,
				target_path: item.from,
				error_message: 'Invalid skill move path'
			})
			const { entry_path: to_path } = assertSkillEntryPath({
				skill_dir,
				target_path: item.to,
				error_message: 'Invalid skill move path'
			})

			if (path.basename(from_path) === 'SKILL.md') {
				throw new Error('SKILL.md cannot be moved')
			}

			if (from_path === skill_dir) {
				throw new Error('Skill root cannot be moved')
			}

			if (to_path === skill_dir) {
				throw new Error('Skill root cannot be replaced')
			}
		}

		for (const item of input.operations) {
			const from_path = path.resolve(item.from)
			const to_path = path.resolve(item.to)

			await fs.ensureDir(path.dirname(to_path))
			await fs.move(from_path, to_path, { overwrite: false })
		}

		return { ok: true }
	})
