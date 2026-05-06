import path from 'path'
import { skill } from '@core/db/schema'
import { getSkill, removeAgentSkillsBySkillIds, removeSkill } from '@core/db/services'
import { eq } from 'drizzle-orm'
import fs from 'fs-extra'
import { object, string } from 'zod'

import { p } from '../../utils/trpc'
import { rebuildGlobalSkillMap } from './utils'

const input_type = object({ id: string() })

export default p.input(input_type).mutation(async ({ input }) => {
	const current_skill = await getSkill(eq(skill.id, input.id))

	if (!current_skill) {
		return null
	}

	await removeAgentSkillsBySkillIds([input.id])

	if (current_skill.path) {
		await fs.remove(
			current_skill.path.endsWith('SKILL.md') ? path.dirname(current_skill.path) : current_skill.path
		)
	}

	const removed_skill = await removeSkill(eq(skill.id, input.id))

	await rebuildGlobalSkillMap()

	return removed_skill
})
