import { boolean, object, string } from 'zod'

import { p } from '../../utils/trpc'
import { extractLinkcaseArticle } from './utils'

const input_type = object({
	id: string(),
	force: boolean().optional()
})

export default p.input(input_type).mutation(async ({ input }) => extractLinkcaseArticle(input))
