import { object, string } from 'zod'

import { p } from '../utils/trpc'

export default p.input(object({ name: string() })).query(async ({ input }) => {
	return {
		message: `Hello, ${input.name} from Polywise RPC!`
	}
})
