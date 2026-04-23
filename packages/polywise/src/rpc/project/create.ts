import { object, string } from 'zod'

import { addProject } from '../../db/services'
import { p } from '../../utils/trpc'

const input_type = object({ name: string(), dir: string() })

export default p.input(input_type).mutation(async ({ input }) => {
	return addProject({
		name: input.name,
		dir: input.dir,
		order: Date.now()
	})
})
