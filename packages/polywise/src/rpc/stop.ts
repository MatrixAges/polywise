import { boolean, number, object, string } from 'zod'

import { scheduleRuntimeStop } from '../utils/runtimeControl'
import { p } from '../utils/trpc'

const output_type = object({
	ok: boolean(),
	action: string(),
	pid: number(),
	scheduled: boolean()
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/stop',
			description: 'Schedule the Polywise runtime to stop.'
		}
	})
	.output(output_type)
	.mutation(async () => {
		return {
			ok: true,
			action: 'stop',
			...scheduleRuntimeStop()
		}
	})
