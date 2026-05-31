import { object, string } from 'zod'

import { p } from '../utils/trpc'

const input_type = object({ name: string() })
const output_type = object({ message: string() })

export default p
	.meta({
		openapi: {
			method: 'GET',
			path: '/test',
			description: 'Test server connectivity'
		}
	})
	.input(input_type)
	.output(output_type)
	.query(async ({ input }) => {
		return {
			message: `Hello, ${input.name} from Polywise RPC!`
		}
	})
