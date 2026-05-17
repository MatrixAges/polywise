import { object, string } from 'zod'

import { p } from '../../utils/trpc'
import { removeLinkcaseItem } from './utils'

const input_type = object({
	id: string()
})

export default p.input(input_type).mutation(async ({ input }) => removeLinkcaseItem(input.id))
