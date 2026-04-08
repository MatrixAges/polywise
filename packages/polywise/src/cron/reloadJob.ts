import createJob from './createJob'
import getJob from './getJob'
import log from './log'
import saveCronStore from './saveStore'
import stopJob from './stopJob'

import type { CronRuntime } from './types'

export default async (runtime: CronRuntime, name: string) => {
	stopJob(runtime, name)

	const task = getJob(runtime.store, name)

	if (!task) {
		await log(name, 'system', 'task removed from runtime')

		return
	}

	if (!task.enabled) {
		await log(name, 'system', 'task disabled')

		return
	}

	try {
		const job = createJob(runtime, task)

		if (!job) {
			return
		}

		runtime.jobs.set(name, job)

		await log(name, 'system', 'task reloaded')
	} catch (err) {
		const message = err instanceof Error ? err.message : 'unknown error'

		task.last_status = 'error'
		task.last_error = message
		task.updated_at = new Date().toISOString()

		await saveCronStore(runtime.store)
		await log(name, 'error', `reload failed: ${message}`)

		throw err
	}
}
