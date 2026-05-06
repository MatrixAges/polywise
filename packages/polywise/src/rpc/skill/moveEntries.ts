import path from 'path'
import { skill } from '@core/db/schema'
import { getSkill } from '@core/db/services'
import { eq } from 'drizzle-orm'
import fs from 'fs-extra'
import { array, object, string } from 'zod'

import { p } from '../../utils/trpc'

const input_type = object({
	skill_id: string(),
	operations: array(
		object({
			from: string(),
			to: string()
		})
	)
})

export default p.input(input_type).mutation(async ({ input }) => {
	const current_skill = await getSkill(eq(skill.id, input.skill_id))

	if (!current_skill) {
		throw new Error(`Skill not found: ${input.skill_id}`)
	}

	const skill_dir = current_skill.path.endsWith('SKILL.md') ? path.dirname(current_skill.path) : current_skill.path

	for (const item of input.operations) {
		const from_path = path.resolve(item.from)
		const to_path = path.resolve(item.to)
		const relative_from_path = path.relative(skill_dir, from_path)
		const relative_to_path = path.relative(skill_dir, to_path)

		if (
			relative_from_path.startsWith('..') ||
			path.isAbsolute(relative_from_path) ||
			relative_to_path.startsWith('..') ||
			path.isAbsolute(relative_to_path)
		) {
			throw new Error('Invalid skill move path')
		}

		if (path.basename(from_path) === 'SKILL.md') {
			throw new Error('SKILL.md cannot be moved')
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
