import { project } from '@core/db/schema'
import { eq } from 'drizzle-orm'
import { object, string } from 'zod'

import { setProject } from '../../db/services'
import { p } from '../../utils/trpc'

const input_type = object({ id: string(), name: string() })

export default p.input(input_type).mutation(async ({ input }) => {
	return setProject(eq(project.id, input.id), { name: input.name })
})
