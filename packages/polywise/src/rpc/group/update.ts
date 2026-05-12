import { group } from '@core/db/schema'
import { setGroup } from '@core/db/services'
import { eq } from 'drizzle-orm'
import { object, string, unknown } from 'zod'

import { p } from '../../utils/trpc'

const input_type = object({
	id: string(),
	name: string().optional(),
	description: string().optional(),
	photo: unknown().optional()
})

export default p.input(input_type).mutation(async ({ input }) => {
	return setGroup(eq(group.id, input.id), {
		...(input.name !== undefined ? { name: input.name } : {}),
		...(input.description !== undefined ? { description: input.description } : {}),
		...(input.photo !== undefined ? { photo: input.photo as Uint8Array | null } : {})
	})
})
