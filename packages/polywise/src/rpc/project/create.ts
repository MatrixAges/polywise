import path from 'path'
import { object, string } from 'zod'

import { addProject } from '../../db/services'
import { p } from '../../utils/trpc'

const input_type = object({ dir: string() })

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/project/create',
			description: 'Create a project from a local workspace directory.'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		const { dir } = input

		return addProject({
			name: path.basename(dir),
			dir,
			order: Date.now()
		})
	})
