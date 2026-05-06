import path from 'path'
import { skill } from '@core/db/schema'
import { getSkill } from '@core/db/services'
import { eq } from 'drizzle-orm'
import fs from 'fs-extra'
import { literal, object, string, union } from 'zod'

import { p } from '../../utils/trpc'

const input_type = object({
	skill_id: string(),
	parent_path: string(),
	name: string(),
	type: union([literal('file'), literal('folder')])
})

export default p.input(input_type).mutation(async ({ input }) => {
	const current_skill = await getSkill(eq(skill.id, input.skill_id))

	if (!current_skill) {
		throw new Error(`Skill not found: ${input.skill_id}`)
	}

	const skill_dir = current_skill.path.endsWith('SKILL.md') ? path.dirname(current_skill.path) : current_skill.path
	const parent_path = path.resolve(input.parent_path)
	const target_path = path.resolve(parent_path, input.name)
	const relative_parent_path = path.relative(skill_dir, parent_path)
	const relative_target_path = path.relative(skill_dir, target_path)

	if (
		relative_parent_path.startsWith('..') ||
		path.isAbsolute(relative_parent_path) ||
		relative_target_path.startsWith('..') ||
		path.isAbsolute(relative_target_path)
	) {
		throw new Error('Invalid skill entry path')
	}

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
