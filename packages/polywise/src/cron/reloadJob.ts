import createJob from './createJob'
import getJob from './getJob'
import log from './log'
import saveCronStore from './saveStore'
import stopJob from './stopJob'

import type { CronRuntime } from './types'

export default async (runtime: CronRuntime, name: string) => {
	stopJob(runtime, name)

	const job = getJob(runtime.store, name)

	if (!job) {
		await log(name, 'system', 'job removed from runtime')

		return
	}

	if (!job.enabled) {
		await log(name, 'system', 'job disabled')

		return
	}

	try {
		const cron_job = createJob(runtime, job)

		if (!cron_job) {
			return
		}

		runtime.jobs.set(name, cron_job)

		await log(name, 'system', 'job reloaded')
	} catch (err) {
		const message = err instanceof Error ? err.message : 'unknown error'

		job.last_status = 'error'
		job.last_error = message
		job.updated_at = new Date().toISOString()

		await saveCronStore(runtime.store)
		await log(name, 'error', `reload failed: ${message}`)

		throw err
	}
}
