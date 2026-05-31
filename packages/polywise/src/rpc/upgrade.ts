import { array, boolean, number, object, string } from 'zod'

import { upgradeRuntime } from '../utils/runtimeControl'
import { p } from '../utils/trpc'

const output_type = object({
	ok: boolean(),
	action: string(),
	package_manager: string(),
	command: string(),
	stdout: string(),
	stderr: string(),
	exit_code: number(),
	restart_scheduled: boolean(),
	launcher_pid: number().nullable(),
	exec_path: string(),
	args: array(string())
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/upgrade',
			description: 'Upgrade Polywise and restart the server'
		}
	})
	.output(output_type)
	.mutation(async () => {
		const result = await upgradeRuntime()

		return {
			ok: true,
			action: 'upgrade',
			...result
		}
	})
