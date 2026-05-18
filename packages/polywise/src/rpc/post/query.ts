import { number, object, string } from 'zod'

import { p } from '../../utils/trpc'
import { queryPosts } from './utils'

export default p
	.input(
		object({
			page: number().int().min(1),
			for_type: string().optional()
		})
	)
	.query(async ({ input }) => queryPosts(input))
