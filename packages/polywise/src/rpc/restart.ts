import { array, boolean, number, object, string } from 'zod'

import { scheduleRuntimeRestart } from '../utils/runtimeControl'
import { p } from '../utils/trpc'

const output_type = object({
	ok: boolean(),
	action: string(),
	pid: number(),
	scheduled: boolean(),
	launcher_pid: number().nullable(),
	exec_path: string(),
	args: array(string())
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/restart',
			description: 'Schedule the Polywise runtime to restart.'
		}
	})
	.output(output_type)
	.mutation(async () => {
		return {
			ok: true,
			action: 'restart',
			...scheduleRuntimeRestart()
		}
	})
