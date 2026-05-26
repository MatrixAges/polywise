import { object, string } from 'zod'

import { p } from '../utils/trpc'
import { polywise_version } from '../version'

const output_type = object({
	version: string()
})

export default p
	.meta({
		openapi: {
			method: 'GET',
			path: '/version',
			summary: 'Get Polywise version'
		}
	})
	.output(output_type)
	.query(() => ({
		version: polywise_version
	}))
