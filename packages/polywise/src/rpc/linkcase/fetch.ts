import { boolean, number, object, string } from 'zod'

import { p } from '../../utils/trpc'
import { fetchLinkcaseLink } from './utils'

const input_type = object({
	id: string(),
	exec_pipeline: boolean().optional(),
	max_chars: number().int().positive().optional()
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/linkcase/fetch',
			description: 'Fetch remote content for one linkcase item and optionally run the pipeline.'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => fetchLinkcaseLink(input))
