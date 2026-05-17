import { object, string, url } from 'zod'

import { p } from '../../utils/trpc'
import { updateLinkcaseItem } from './utils'

const input_type = object({
	id: string(),
	url: url(),
	title: string().optional(),
	content: string().optional()
})

export default p.input(input_type).mutation(async ({ input }) => {
	return updateLinkcaseItem(input)
})
