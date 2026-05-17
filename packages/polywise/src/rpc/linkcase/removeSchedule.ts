import { object, string } from 'zod'

import { p } from '../../utils/trpc'
import { removeLinkcaseSchedule } from './scheduler'

const input_type = object({
	id: string()
})

export default p.input(input_type).mutation(async ({ input }) => removeLinkcaseSchedule(input.id))
