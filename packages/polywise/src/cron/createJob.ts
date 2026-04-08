import { Cron } from 'croner'

import getJob from './getJob'
import log from './log'
import saveStore from './saveStore'

import type { CronRuntime, CronTask } from './types'

export default (runtime: CronRuntime, task: CronTask) => {
	if (!task.enabled) return null

	const job = new Cron(task.cron, async () => {
		const start_time = Date.now()

		await log(task.name, 'trigger', 'run started')

		try {
			const target = getJob(runtime.store, task.name)

			if (!target) {
				await log(task.name, 'error', 'task missing in memory store')

				return
			}

			target.last_run_at = new Date().toISOString()
			target.last_status = 'success'
			target.last_error = null
			target.updated_at = new Date().toISOString()

			await saveStore(runtime.store)

			const cost_ms = Date.now() - start_time

			await log(task.name, 'success', `run finished (cost_ms=${cost_ms})`)
		} catch (err) {
			const message = err instanceof Error ? err.message : 'unknown error'
			const target = getJob(runtime.store, task.name)

			if (target) {
				target.last_run_at = new Date().toISOString()
				target.last_status = 'error'
				target.last_error = message
				target.updated_at = new Date().toISOString()

				await saveStore(runtime.store)
			}

			await log(task.name, 'error', `run failed: ${message}`)
		}
	})

	return job
}
