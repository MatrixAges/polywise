import { boolean, number, object } from 'zod'

import { p } from '../../utils/trpc'
import { runLinkcaseBatch } from './utils'

const input_type = object({
	count: number().int().min(1).max(10),
	run_fetch: boolean(),
	run_extract: boolean()
})

export default p.input(input_type).mutation(async ({ input }) => runLinkcaseBatch(input))
