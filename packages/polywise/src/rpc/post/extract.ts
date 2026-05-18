import { boolean, object, string } from 'zod'

import { p } from '../../utils/trpc'
import { extractPostArticle } from './utils'

export default p
	.input(
		object({
			id: string(),
			force: boolean().optional()
		})
	)
	.mutation(async ({ input }) => extractPostArticle(input))
