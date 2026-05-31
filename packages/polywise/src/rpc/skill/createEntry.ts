import path from 'path'
import { skill } from '@core/db/schema'
import { getSkill } from '@core/db/services'
import { eq } from 'drizzle-orm'
import fs from 'fs-extra'
import { literal, object, string, union } from 'zod'

import { p } from '../../utils/trpc'
import { assertSkillEntryPath, getSkillItemDirPath } from './utils'

const input_type = object({
	skill_id: string(),
	parent_path: string(),
	name: string(),
	type: union([literal('file'), literal('folder')])
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/skill/createEntry',
			description: 'Run Create Entry'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		const current_skill = await getSkill(eq(skill.id, input.skill_id))

		if (!current_skill) {
			throw new Error(`Skill not found: ${input.skill_id}`)
		}

		const skill_dir = getSkillItemDirPath(current_skill)
		const { entry_path: parent_path } = assertSkillEntryPath({
			skill_dir,
			target_path: input.parent_path,
			error_message: 'Invalid skill entry path',
			allow_root: true
		})
		const target_path = path.resolve(parent_path, input.name)

		assertSkillEntryPath({
			skill_dir,
			target_path: target_path,
			error_message: 'Invalid skill entry path'
		})

		if (await fs.pathExists(target_path)) {
			throw new Error(`Entry already exists: ${input.name}`)
		}

		if (input.type === 'folder') {
			await fs.ensureDir(target_path)

			return { path: `${target_path}/`, type: 'folder' as const }
		}

		await fs.ensureDir(path.dirname(target_path))
		await fs.writeFile(target_path, '', 'utf8')

		return { path: target_path, type: 'file' as const }
	})
