import { group } from '@core/db/schema'
import { setGroup } from '@core/db/services'
import { eq } from 'drizzle-orm'
import { object, string } from 'zod'

import { p } from '../../utils/trpc'

const input_type = object({
	id: string(),
	name: string().optional(),
	description: string().optional()
})

export default p.input(input_type).mutation(async ({ input }) => {
	return setGroup(eq(group.id, input.id), {
		...(input.name !== undefined ? { name: input.name } : {}),
		...(input.description !== undefined ? { description: input.description } : {})
	})
})
