import { Cron } from 'croner'

import getJob from './getJob'
import log from './log'
import runJobSession from './runJobSession'
import saveStore from './saveStore'

import type { CronJob, CronRuntime } from './types'

export default (runtime: CronRuntime, job: CronJob) => {
	if (!job.enabled) return null

	const cron_job = new Cron(job.cron, async () => {
		const start_time = Date.now()

		await log(job.name, 'trigger', 'run started')

		try {
			const target = getJob(runtime.store, job.name)

			if (!target) {
				await log(job.name, 'error', 'job missing in memory store')

				return
			}

			await runJobSession(job)

			target.last_run_at = new Date().toISOString()
			target.last_status = 'success'
			target.last_error = null
			target.updated_at = new Date().toISOString()

			await saveStore(runtime.store)

			const cost_ms = Date.now() - start_time

			await log(job.name, 'success', `run finished (cost_ms=${cost_ms})`)
		} catch (err) {
			const message = err instanceof Error ? err.message : 'unknown error'
			const target = getJob(runtime.store, job.name)

			if (target) {
				target.last_run_at = new Date().toISOString()
				target.last_status = 'error'
				target.last_error = message
				target.updated_at = new Date().toISOString()

				await saveStore(runtime.store)
			}

			await log(job.name, 'error', `run failed: ${message}`)
		}
	})

	return cron_job
}
