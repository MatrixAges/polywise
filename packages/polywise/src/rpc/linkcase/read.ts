import { object, string } from 'zod'

import { p } from '../../utils/trpc'
import { getLinkcaseReadItem } from './utils'

const input_type = object({
	id: string()
})

export default p.input(input_type).query(async ({ input }) => getLinkcaseReadItem(input.id))
