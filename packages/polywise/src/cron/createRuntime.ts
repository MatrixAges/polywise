import createJob from './createJob'
import log from './log'

import type { CronRuntime, CronStore } from './types'

export default async (store: CronStore) => {
	const runtime = {
		store,
		jobs: new Map()
	} as CronRuntime

	for (const task of store.tasks) {
		if (!task.enabled) {
			continue
		}

		try {
			const job = createJob(runtime, task)

			if (!job) {
				continue
			}

			runtime.jobs.set(task.name, job)
		} catch (err) {
			const message = err instanceof Error ? err.message : 'unknown error'

			await log(task.name, 'error', `load failed: ${message}`)
		}
	}

	await log('system', 'system', `loaded ${runtime.jobs.size} cron jobs`)

	return runtime
}
