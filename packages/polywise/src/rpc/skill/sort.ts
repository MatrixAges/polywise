import { skill } from '@core/db/schema'
import { getSkills, setSkill } from '@core/db/services'
import { eq } from 'drizzle-orm'
import { number, object } from 'zod'

import arrayMove from '../../utils/arrayMove'
import { p } from '../../utils/trpc'

const input_type = object({ from: number().int(), to: number().int() })

export default p.input(input_type).mutation(async ({ input }) => {
	const skill_items = await getSkills()

	if (!skill_items[input.from] || input.to > skill_items.length - 1) {
		return skill_items
	}

	const next_skill_items = arrayMove({ list: skill_items, from: input.from, to: input.to })

	await Promise.all(next_skill_items.map((item, index) => setSkill(eq(skill.id, item.id), { order: index })))

	return next_skill_items
})
