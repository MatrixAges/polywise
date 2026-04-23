import { project } from '@core/db/schema'
import { eq } from 'drizzle-orm'
import { object, string } from 'zod'

import { removeProject } from '../../db/services'
import { p } from '../../utils/trpc'

const input_type = object({ id: string() })

export default p.input(input_type).mutation(async ({ input }) => {
	return removeProject(eq(project.id, input.id))
})
