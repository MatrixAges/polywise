import path from 'path'
import { object, string } from 'zod'

import { addProject } from '../../db/services'
import { p } from '../../utils/trpc'

const input_type = object({ dir: string() })

export default p.input(input_type).mutation(async ({ input }) => {
	const { dir } = input

	return addProject({
		name: path.basename(dir),
		dir,
		order: Date.now()
	})
})
