import { object, string } from 'zod'

import { p } from '../utils/trpc'

const input_type = object({ name: string() })

export default p
	.meta({ openapi: { method: 'GET', path: '/test' } })
	.input(input_type)
	.query(async ({ input }) => {
		return {
			message: `Hello, ${input.name} from Polywise RPC!`
		}
	})
