import createJob from './createJob'
import log from './log'

import type { CronRuntime, CronStore } from './types'

export default async (store: CronStore) => {
	const runtime = {
		store,
		jobs: new Map()
	} as CronRuntime

	for (const job of store.jobs) {
		if (!job.enabled) {
			continue
		}

		try {
			const cron_job = createJob(runtime, job)

			if (!cron_job) {
				continue
			}

			runtime.jobs.set(job.name, cron_job)
		} catch (err) {
			const message = err instanceof Error ? err.message : 'unknown error'

			await log(job.name, 'error', `load failed: ${message}`)
		}
	}

	await log('system', 'system', `loaded ${runtime.jobs.size} cron jobs`)

	return runtime
}
